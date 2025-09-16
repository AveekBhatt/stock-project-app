const { supabase } = require("../utils/supabaseClient");

function formatDateOnlyIST(date) {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); 
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  return today
}

const reward = async(req,res) =>{
    try {
    const { user_id, stock_symbol, quantity, action_type, reward_timestamp } = req.body;

    if (!user_id || !stock_symbol || !quantity || !action_type || !reward_timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const reward_id = 5834;

    const { error: rewardError } = await supabase
      .from("reward_events")
      .insert([
        {
          reward_id : reward_id,
          user_id : user_id,
          stock_symbol : stock_symbol,
          quantity : quantity,
          action_type : action_type,
          reward_timestamp : reward_timestamp,
        },
      ]).select().single();
    
    if (rewardError) throw rewardError;
    console.log(stock_symbol)
    
    const { data, error } = await supabase.from('user_holdings').upsert({
    user_id: user_id,
    stock_symbol: stock_symbol,
    quantity: quantity
   })
  if (error) throw error;

    const now = new Date().toISOString();
    console.log("222")
    const { error: ledgerError } = await supabase
      .from("ledger_entries")
      .insert([
        {
          reward_id,
          account_type: "stock_inventory",
          stock_symbol,
          amount: 0, 
          quantity,
          description: `Rewarded ${quantity} shares of ${stock_symbol}`,
          entry_timestamp: reward_timestamp,
        },
      ]);
      

    if (ledgerError) throw ledgerError;

    res.status(201).json({ message: "Reward recorded successfully", reward_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

const todaystocks = async(req,res) =>{
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const today = new Date();
    console.log(formatDateOnlyIST(today))
    const { data, error } = await supabase
      .from("reward_events")
      .select("reward_id, stock_symbol, quantity, action_type, reward_timestamp")
      .eq("user_id", userId)
      .gte("reward_timestamp", formatDateOnlyIST(today) + " 00:00:00")
      .lte("reward_timestamp", formatDateOnlyIST(today) + " 23:59:59");

    if (error) throw error;

    res.status(200).json({ userId, rewards: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

const historicalinr = async(req,res) =>{
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    const endDate = yesterday.toISOString();

    console.log(`Fetching rewards for user ${userId} up to ${endDate}`);

    const { data: rewards, error: rewardsError } = await supabase
      .from("reward_events")
      .select("reward_id, stock_symbol, quantity, reward_timestamp")
      .eq("user_id", userId)
      .lte("reward_timestamp", endDate)
      .order("reward_timestamp", { ascending: true });

    if (rewardsError) throw rewardsError;

    console.log(`Found ${rewards?.length || 0} rewards`);

    if (!rewards || rewards.length === 0) {
      return res.status(200).json({ userId, historical: [] });
    }

    const stockSymbols = [...new Set(rewards.map(r => r.stock_symbol))];
    console.log('Stock symbols found:', stockSymbols);

    const { data: allPriceData, error: priceError } = await supabase
      .from("stock_prices")
      .select("stock_symbol, price, price_timestamp")
      .in("stock_symbol", stockSymbols)
      .order("price_timestamp", { ascending: true });

    if (priceError) throw priceError;

    console.log(`Found ${allPriceData?.length || 0} price records`);

    if (allPriceData && allPriceData.length > 0) {
      console.log('Price data found:', allPriceData);
    } else {
      console.log('NO PRICE DATA FOUND for symbols:', stockSymbols);
    }

    const results = rewards.map(reward => {
      const symbolPrices = allPriceData?.filter(p => p.stock_symbol === reward.stock_symbol) || [];
      
      let applicablePrice = null;
      if (symbolPrices.length > 0) {
        applicablePrice = symbolPrices
          .sort((a, b) => new Date(b.price_timestamp) - new Date(a.price_timestamp))
          .find(price => new Date(price.price_timestamp) <= new Date(reward.reward_timestamp));
      }

      const price = applicablePrice ? Number(applicablePrice.price) : 0;
      const inr_value = Number(reward.quantity) * price;

      console.log(`Reward ${reward.reward_id}: ${reward.quantity} ${reward.stock_symbol} @ ${price} = ${inr_value}`);

      return {
        reward_id: reward.reward_id,
        stock_symbol: reward.stock_symbol,
        quantity: reward.quantity,
        reward_date: reward.reward_timestamp,
        inr_value: inr_value,
        price_used: price,
        price_timestamp: applicablePrice ? applicablePrice.price_timestamp : 'No price found'
      };
    });

    const historical = {};
    results.forEach((r) => {
      const date = r.reward_date.split('T')[0]; 
      if (!historical[date]) historical[date] = 0;
      historical[date] += r.inr_value;
    });

    const response = Object.entries(historical)
      .map(([date, inr_value]) => ({ date, inr_value }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('Final historical data:', response);

    res.status(200).json({ 
      userId, 
      historical: response,
      total_rewards: rewards.length,
      total_inr_value: response.reduce((sum, item) => sum + item.inr_value, 0)
    });
  } catch (err) {
    console.error('Error in historicalinr:', err);
    res.status(500).json({ error: "Internal server error" });
  }
}
const stats = async(req,res) => {
   try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data: todayRewards, error: todayError } = await supabase
      .from("reward_events")
      .select("stock_symbol, quantity")
      .eq("user_id", userId)
      .gte("reward_timestamp", startOfDay)
      .lte("reward_timestamp", endOfDay);

    if (todayError) throw todayError;

    const rewardsGrouped = {};
    todayRewards.forEach((r) => {
      if (!rewardsGrouped[r.stock_symbol]) rewardsGrouped[r.stock_symbol] = 0;
      rewardsGrouped[r.stock_symbol] += Number(r.quantity);
    });

    const todaySummary = Object.keys(rewardsGrouped).map((symbol) => ({
      stock_symbol: symbol,
      total_quantity: rewardsGrouped[symbol],
    }));

    const { data: holdings, error: holdingsError } = await supabase
      .from("user_holdings")
      .select("stock_symbol, quantity")
      .eq("user_id", userId);

    if (holdingsError) throw holdingsError;

    let totalInrValue = 0;
    for (let h of holdings) {
      const { data: priceData, error: priceError } = await supabase
        .from("stock_prices")
        .select("price")
        .eq("stock_symbol", h.stock_symbol)
        .eq("is_latest", true)
        .single();

      if (priceError) throw priceError;

      const stockValue = Number(h.quantity) * Number(priceData.price);
      totalInrValue += stockValue;
    }

    res.status(200).json({
      userId,
      today_rewards: todaySummary,
      portfolio_inr_value: totalInrValue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

const portfolio = async(req,res) =>{
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const { data: holdings, error: holdingsError } = await supabase
      .from("user_holdings")
      .select("stock_symbol, quantity")
      .eq("user_id", userId);

    if (holdingsError) throw holdingsError;

    const portfolio = [];

    for (let h of holdings) {
      const { data: priceData, error: priceError } = await supabase
        .from("stock_prices")
        .select("price")
        .eq("stock_symbol", h.stock_symbol)
        .eq("is_latest", true)
        .single();

      if (priceError) throw priceError;

      const latestPrice = Number(priceData.price);
      const inrValue = Number(h.quantity) * latestPrice;

      portfolio.push({
        stock_symbol: h.stock_symbol,
        quantity: Number(h.quantity),
        latest_price: latestPrice,
        inr_value: inrValue,
      });
    }

    res.status(200).json({ userId, portfolio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {reward , todaystocks , historicalinr , stats , portfolio}