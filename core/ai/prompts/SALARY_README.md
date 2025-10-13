# Salary Benchmarking - Implementation Notes

## Status: Gated Feature

Salary lookup requires:
1. Network ON
2. Valid API key
3. User explicit consent (additional toggle)

## Data Sources

When enabled, use:
- `salary_benchmarks` table (cached data)
- External APIs (Glassdoor, Levels.fyi) with rate limiting
- User-provided data points

## Privacy

- Never send PII to external services
- Only send: role title, seniority, location (city/state)
- Cache results for 120 days (configurable TTL)
- User can clear cached salary data anytime

## Prompt Template (Future)

```markdown
# Salary Benchmark Lookup

Role: {{roleTitle}}
Seniority: {{seniority}}
Location: {{city}}, {{state}}
Company Size: {{companySize}}

Return: base_min, base_mid, base_max, tc_min, tc_mid, tc_max, sources[]
```

## Implementation Timeline

- v1.2: Scaffold only (this README)
- v1.3: Add salary lookup capability
- v1.4: Offer negotiation wizard

