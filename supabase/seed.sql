-- =============================================================================
-- 🛡️ FRAUD LOCK: Seed Data (Aggregated Threats & Verified Safety Content)
-- =============================================================================

-- Seed Coarse Regional Threat Map Data
INSERT INTO public.aggregated_threats (region, country, approx_lat, approx_lng, scam_category, report_count, trend, recent_summary)
VALUES
  ('Northern Zone (Delhi NCR, Haryana, UP)', 'India', 28.6139, 77.2090, 'Electricity Bill Cut & Courier Drugs Extortion', 1420, 'increasing', 'Spike in fake electricity bill SMS sent after 7 PM threatening power cuts at 9:30 PM.'),
  ('Western Zone (Mumbai, Pune, Ahmedabad)', 'India', 19.0760, 72.8777, 'Customs Digital Arrest & AnyDesk Support', 1890, 'increasing', 'High incidence of Skype video call extortion impersonating Crime Branch and narcotics officers.'),
  ('Southern Zone (Bengaluru, Hyderabad, Chennai)', 'India', 12.9716, 77.5946, 'Telegram Part-Time Task & YouTube Like Scams', 2150, 'increasing', 'Prepaid task investment scams targeting tech employees with promise of ₹5000 daily payout.'),
  ('Eastern Zone (Kolkata, Patna, Bhubaneswar)', 'India', 22.5726, 88.3639, 'Fake KYC / SIM Deactivation SMS', 980, 'stable', 'SMS claiming 4G/5G SIM card will be blocked unless Aadhaar document is uploaded.'),
  ('International & Cross-Border Scams', 'Global', 0.0000, 0.0000, 'Cryptocurrency Arbitrage & Romance Scams', 3410, 'increasing', 'Fake trading websites hosted on foreign VPS servers promising 200% return in 48 hours.')
ON CONFLICT DO NOTHING;
