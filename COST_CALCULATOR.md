# JoTrack - Cost Calculator & Financial Models

**Date**: October 20, 2025  
**Purpose**: Interactive cost models for different user scales

---

## 🧮 Cost Calculator

### Variable Inputs

```javascript
// Adjust these to see different scenarios
const TOTAL_USERS = 5000;
const PAID_CONVERSION_RATE = 0.20; // 20%
const JOBS_PER_USER_PER_WEEK = 3.5;
const ANALYSES_PER_JOB = 1; // Average (some users analyze multiple times)
const COST_PER_ANALYSIS = 0.22; // Claude + Tavily
const MONTHLY_PRICE = 12; // Paid tier
```

### Cost Breakdown Calculator

```javascript
// Users
const FREE_USERS = TOTAL_USERS * (1 - PAID_CONVERSION_RATE);
const PAID_USERS = TOTAL_USERS * PAID_CONVERSION_RATE;

// AI Usage
const FREE_ANALYSES_PER_MONTH = 3; // Hard limit
const PAID_ANALYSES_PER_MONTH = JOBS_PER_USER_PER_WEEK * 4.3; // 4.3 weeks/month

// AI Costs
const FREE_AI_COST = FREE_USERS * FREE_ANALYSES_PER_MONTH * COST_PER_ANALYSIS;
const PAID_AI_COST = PAID_USERS * PAID_ANALYSES_PER_MONTH * COST_PER_ANALYSIS;
const TOTAL_AI_COST = FREE_AI_COST + PAID_AI_COST;

// Revenue
const MRR = PAID_USERS * MONTHLY_PRICE;

// Margin
const GROSS_MARGIN = MRR - TOTAL_AI_COST;
const MARGIN_PERCENT = (GROSS_MARGIN / MRR) * 100;
```

### Output (5000 Users, 20% Paid, $12/month)

```
Free Users:          4,000
Paid Users:          1,000
─────────────────────────────
Free AI Cost:        $2,640/month (4000 × 3 × $0.22)
Paid AI Cost:        $3,310/month (1000 × 15 × $0.22)
Total AI Cost:       $5,950/month
─────────────────────────────
MRR:                 $12,000
AI Cost:             $5,950
Infrastructure:      $1,291 (see breakdown below)
─────────────────────────────
Gross Profit:        $4,759/month
Gross Margin:        39.7%
```

---

## 📊 Scenario Analysis

### Scenario 1: Conservative (2500 Users, 15% Paid)

```
Total Users:         2,500
Paid Conversion:     15%
─────────────────────────────
Free Users:          2,125
Paid Users:          375
─────────────────────────────
Free AI Cost:        $1,403/month
Paid AI Cost:        $1,244/month
Total AI Cost:       $2,647/month
─────────────────────────────
MRR:                 $4,500
Infrastructure:      $1,100
Total Costs:         $3,747
─────────────────────────────
Net Profit:          $753/month (16.7% margin)
```

**Break-Even**: Yes ✅  
**Viability**: Sustainable but low margin

---

### Scenario 2: Base Case (5000 Users, 20% Paid)

```
Total Users:         5,000
Paid Conversion:     20%
─────────────────────────────
Free Users:          4,000
Paid Users:          1,000
─────────────────────────────
Free AI Cost:        $2,640/month
Paid AI Cost:        $3,310/month
Total AI Cost:       $5,950/month
─────────────────────────────
MRR:                 $12,000
Infrastructure:      $1,291
Total Costs:         $7,241
─────────────────────────────
Net Profit:          $4,759/month (39.7% margin)
```

**Break-Even**: Yes ✅  
**Viability**: Healthy SaaS margins (target: 70%+ with scale)

---

### Scenario 3: Optimistic (10K Users, 25% Paid)

```
Total Users:         10,000
Paid Conversion:     25%
─────────────────────────────
Free Users:          7,500
Paid Users:          2,500
─────────────────────────────
Free AI Cost:        $4,950/month
Paid AI Cost:        $8,250/month
Total AI Cost:       $13,200/month
─────────────────────────────
MRR:                 $30,000
Infrastructure:      $2,000
Total Costs:         $15,200
─────────────────────────────
Net Profit:          $14,800/month (49.3% margin)
```

**Break-Even**: Yes ✅  
**Viability**: Very healthy, ready to scale further

---

## 💰 Detailed Cost Breakdown by User Scale

### Infrastructure Costs (Scales with Users)

| Service | 1K Users | 2.5K Users | 5K Users | 10K Users |
|---------|----------|------------|----------|-----------|
| **Vercel Pro** | $20 | $20 | $20 | $35 (Team) |
| **Neon DB** | $19 (5GB) | $19 (10GB) | $19 (20GB) | $40 (50GB) |
| **R2 Storage** | $0.20 | $0.50 | $1 | $2 |
| **Clerk Auth** | $0 | $10 | $100 | $200 |
| **Tavily Search** | $20 | $50 | $100 | $200 |
| **SendGrid Email** | $0 | $20 | $20 | $35 |
| **Sentry Monitoring** | $26 | $26 | $26 | $69 |
| **Backup Storage** | $2 | $3 | $5 | $10 |
| **Total Infrastructure** | **$87** | **$148** | **$291** | **$591** |

### Fixed Costs (Per Month)

```
Stripe Fees:         3% of MRR
Domain:              $2/month
Legal (amortized):   $50/month
─────────────────────────────
Total Fixed:         ~$412/month (at 5K users)
```

### AI Costs (Variable)

```
Free Tier:   3 analyses × $0.22 = $0.66/user/month
Paid Tier:   15 analyses × $0.22 = $3.31/user/month
```

---

## 📈 Growth Projections (12 Months)

### Month-by-Month Forecast

| Month | Users | Paid | MRR | AI Cost | Infra | Profit | Cumulative |
|-------|-------|------|-----|---------|-------|--------|------------|
| 1 | 500 | 50 | $600 | $600 | $100 | -$100 | -$100 |
| 2 | 1,000 | 100 | $1,200 | $1,200 | $120 | -$120 | -$220 |
| 3 | 2,000 | 200 | $2,400 | $2,400 | $150 | -$150 | -$370 |
| 4 | 3,000 | 450 | $5,400 | $3,600 | $200 | **+$1,600** | +$1,230 |
| 5 | 4,000 | 640 | $7,680 | $4,800 | $250 | **+$2,630** | +$3,860 |
| 6 | 5,000 | 1,000 | $12,000 | $5,950 | $291 | **+$5,759** | +$9,619 |
| 7 | 6,000 | 1,380 | $16,560 | $7,500 | $350 | **+$8,710** | +$18,329 |
| 8 | 7,000 | 1,750 | $21,000 | $9,000 | $400 | **+$11,600** | +$29,929 |
| 9 | 8,000 | 2,080 | $24,960 | $10,400 | $450 | **+$14,110** | +$44,039 |
| 10 | 9,000 | 2,475 | $29,700 | $11,900 | $500 | **+$17,300** | +$61,339 |
| 11 | 10,000 | 2,750 | $33,000 | $13,200 | $591 | **+$19,209** | +$80,548 |
| 12 | 10,000 | 3,000 | $36,000 | $13,800 | $591 | **+$21,609** | +$102,157 |

**Key Milestones**:
- **Month 4**: Break-even (3000 users, 15% paid)
- **Month 6**: $12K MRR (target scale)
- **Month 12**: $36K MRR, $102K cumulative profit

**Assumptions**:
- Organic growth (500 users/month first 3 months)
- Paid acquisition starts Month 4 (CAC: $30, 3-month payback)
- Conversion improves from 10% → 30% (better onboarding)
- Churn rate: 5%/month

---

## 🎯 Unit Economics

### Customer Acquisition Cost (CAC)

```
Paid Ads:            $30/signup (Google, LinkedIn)
Content Marketing:   $5/signup (SEO, blog)
Referrals:           $0/signup (viral loop)
─────────────────────────────
Blended CAC:         $15/signup (mix of channels)
```

### Customer Lifetime Value (LTV)

```
Monthly Price:       $12
Average Lifetime:    18 months (5.5% churn)
Gross Margin:        60% (after AI + infra costs)
─────────────────────────────
LTV:                 $12 × 18 × 0.60 = $129.60
```

### LTV:CAC Ratio

```
LTV:                 $129.60
CAC:                 $15
─────────────────────────────
Ratio:               8.6:1 (Excellent! >3:1 is good)
```

### Payback Period

```
Monthly Gross Profit: $12 × 0.60 = $7.20
CAC:                  $15
─────────────────────────────
Payback:              2.08 months (Great! <12 months ideal)
```

---

## 💸 Pricing Tier Analysis

### Option A: $10/month (Lower Price, More Volume)

```
Conversion:          25% (higher due to lower price)
MRR (5K users):      $12,500
AI Cost:             $5,950
Infrastructure:      $1,291
Net Profit:          $5,259/month (42.1% margin)
```

**Pros**: Higher conversion, more users  
**Cons**: Lower revenue per user

---

### Option B: $12/month (Base Case)

```
Conversion:          20%
MRR (5K users):      $12,000
AI Cost:             $5,950
Infrastructure:      $1,291
Net Profit:          $4,759/month (39.7% margin)
```

**Pros**: Balanced pricing, good margins  
**Cons**: None

---

### Option C: $15/month (Premium Price)

```
Conversion:          15% (lower due to higher price)
MRR (5K users):      $11,250
AI Cost:             $4,463 (less AI usage due to fewer paid users)
Infrastructure:      $1,291
Net Profit:          $5,496/month (48.8% margin)
```

**Pros**: Higher margins, attracts serious users  
**Cons**: Lower total revenue

---

### Option D: Multi-Tier ($0 / $12 / $30)

```
Free Tier:           70% (3,500 users) → 3 analyses/month
Basic Tier:          20% (1,000 users) → $12/month, 30 jobs
Pro Tier:            10% (500 users) → $30/month, unlimited + coaching
─────────────────────────────
Free AI Cost:        $2,310/month
Basic AI Cost:       $3,310/month
Pro AI Cost:         $5,775/month (higher usage)
Total AI Cost:       $11,395/month
─────────────────────────────
MRR:                 $27,000 (1000 × $12 + 500 × $30)
Infrastructure:      $1,291
Total Costs:         $12,686
Net Profit:          $14,314/month (53.0% margin!)
```

**Recommendation**: **Option D (Multi-Tier)** 🏆
- Highest revenue ($27K vs $12K)
- Best margins (53% vs 40%)
- Appeals to different user segments

---

## 🔥 Burn Rate Scenarios

### Scenario 1: Bootstrap (Self-Funded)

**Initial Investment**: $10,000  
**Monthly Burn**: $2,500 (early months)  
**Runway**: 4 months to break-even

```
Month 1:             -$2,312
Month 2:             -$2,500
Month 3:             -$1,800
Month 4:             +$1,600 (break-even!)
─────────────────────────────
Total Burn:          -$5,012
Remaining:           $4,988 (buffer)
```

**Risk**: Low (break-even quickly)

---

### Scenario 2: Paid Ads (Accelerated Growth)

**Initial Investment**: $50,000  
**Ad Spend**: $10K/month (Month 1-3)  
**Monthly Burn**: $12,500 (early months)  
**Runway**: 3-4 months to break-even

```
Month 1:             -$12,500 (ads + ops)
Month 2:             -$15,000 (scale ads)
Month 3:             -$10,000 (reduce ads)
Month 4:             +$5,000 (revenue ramps)
Month 5:             +$10,000
Month 6:             +$15,000
─────────────────────────────
Total Burn:          -$17,500 (first 3 months)
Total Profit:        +$30,000 (next 3 months)
Net:                 +$12,500 (after 6 months)
```

**Risk**: Medium (higher upfront cost, faster payback)

---

## 📊 Sensitivity Analysis

### What if AI costs are 2× higher? ($0.44/analysis)

```
Scenario:            5K users, 20% paid
MRR:                 $12,000
AI Cost:             $11,900 (doubled!)
Infrastructure:      $1,291
Net Profit:          -$1,191/month (LOSS)
─────────────────────────────
Break-Even Price:    $15/month (instead of $12)
```

**Mitigation**: 
- Negotiate bulk pricing with Anthropic (10% discount at $50K/year)
- Cache more aggressively (30-day ecosystem cache)
- Increase paid tier to $15/month

---

### What if conversion is only 10%? (Half expected)

```
Scenario:            5K users, 10% paid
MRR:                 $6,000
AI Cost:             $3,960
Infrastructure:      $1,291
Net Profit:          $749/month (12.5% margin)
─────────────────────────────
Break-Even:          Still profitable! ✅
```

**Mitigation**: 
- Improve onboarding (increase conversion)
- Add referral program (viral growth)
- Optimize free tier to hook users

---

## 🎯 Pricing Recommendations

### Final Recommendation: 3-Tier Model

| Tier | Price | Jobs | Analyses | Target Audience |
|------|-------|------|----------|-----------------|
| **Free** | $0 | 3 active | 3/month | Casual job seekers |
| **Basic** | $12/month | 30 | Unlimited | Active job seekers |
| **Pro** | $30/month | Unlimited | Unlimited + Coach | Career changers, executives |

**Expected Distribution**:
- Free: 70% (3,500 users)
- Basic: 20% (1,000 users)
- Pro: 10% (500 users)

**MRR**: $27,000 (vs $12,000 with 2-tier)

---

## 🚀 Key Takeaways

1. **Break-Even**: 3,000 users (15% paid @ $12/month)
2. **Target Scale**: 5,000 users → $12K MRR → $4.7K profit/month
3. **Best Pricing**: 3-tier ($0/$12/$30) → $27K MRR at 5K users
4. **LTV:CAC**: 8.6:1 (excellent economics)
5. **Payback**: 2 months (very healthy)
6. **Runway**: $10K investment → 4-month runway
7. **AI Risk**: Doubling costs requires $15/month pricing
8. **Conversion Risk**: 10% conversion still profitable

---

## ✅ Decision Matrix

| Metric | Conservative | Base | Optimistic |
|--------|-------------|------|------------|
| Users | 2,500 | 5,000 | 10,000 |
| Paid % | 15% | 20% | 25% |
| MRR | $4,500 | $12,000 | $30,000 |
| Margin | 16.7% | 39.7% | 49.3% |
| Viability | ✅ Viable | ✅ Healthy | ✅ Excellent |

**Recommendation**: Launch with **Base Case** ($12/month, 2-tier), then add **Pro tier** ($30) after 3 months based on user feedback.

---

**Last Updated**: October 20, 2025  
**Version**: 1.0  
**Next Review**: After launch (adjust based on real data)

