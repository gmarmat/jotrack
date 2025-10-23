# Anthropic Claude Pricing - January 2025

**Source**: [Anthropic Pricing Documentation](https://claude.com/pricing)  
**Captured**: January 2025  
**Purpose**: Reference for JoTrack cost calculations and UI pricing display

## Model Pricing (USD)

### Standard Pricing (per Million Tokens)

| Model | Input Tokens | Output Tokens | Notes |
|-------|-------------|---------------|-------|
| Claude Opus 4.1 | $15 / MTok | $75 / MTok | Latest Opus |
| Claude Opus 4 | $15 / MTok | $75 / MTok | |
| Claude Sonnet 4.5 | $3 / MTok | $15 / MTok | Latest Sonnet |
| Claude Sonnet 4 | $3 / MTok | $15 / MTok | |
| Claude Sonnet 3.7 | $3 / MTok | $15 / MTok | |
| Claude Sonnet 3.5 | $3 / MTok | $15 / MTok | Deprecated |
| Claude Haiku 4.5 | $1 / MTok | $5 / MTok | Latest Haiku |
| Claude Haiku 3.5 | $0.80 / MTok | $4 / MTok | |
| Claude Opus 3 | $15 / MTok | $75 / MTok | Deprecated |
| Claude Haiku 3 | $0.25 / MTok | $1.25 / MTok | |

### Cache Pricing

| Duration | Input Multiplier | Output Multiplier |
|----------|-----------------|-------------------|
| 5-minute cache | 1.25x base | Same as base |
| 1-hour cache | 2.0x base | Same as base |
| Cache hits | 0.1x base | Same as base |

### Batch Processing (50% discount)

| Model | Batch Input | Batch Output |
|-------|-------------|--------------|
| Claude Opus 4.1 | $7.50 / MTok | $37.50 / MTok |
| Claude Opus 4 | $7.50 / MTok | $37.50 / MTok |
| Claude Sonnet 4.5 | $1.50 / MTok | $7.50 / MTok |
| Claude Sonnet 4 | $1.50 / MTok | $7.50 / MTok |
| Claude Sonnet 3.7 | $1.50 / MTok | $7.50 / MTok |
| Claude Sonnet 3.5 | $1.50 / MTok | $7.50 / MTok |
| Claude Haiku 4.5 | $0.50 / MTok | $2.50 / MTok |
| Claude Haiku 3.5 | $0.40 / MTok | $2 / MTok |
| Claude Opus 3 | $7.50 / MTok | $37.50 / MTok |
| Claude Haiku 3 | $0.125 / MTok | $0.625 / MTok |

### Long Context Pricing (Sonnet 4/4.5 only)

| Input Tokens | Input Price | Output Price |
|--------------|-------------|--------------|
| ≤ 200K tokens | $3 / MTok | $15 / MTok |
| > 200K tokens | $6 / MTok | $22.50 / MTok |

### Tool Use Pricing

#### System Prompt Overhead
- **Claude 4.x models**: 346 tokens (auto/none) or 313 tokens (any/tool)
- **Claude 3.7**: 346 tokens (auto/none) or 313 tokens (any/tool)
- **Claude 3.5**: 346 tokens (auto/none) or 313 tokens (any/tool)
- **Claude 3**: 159-530 tokens (varies by model and tool choice)

#### Specific Tools
- **Bash tool**: +245 input tokens
- **Text editor**: +700 input tokens
- **Web search**: $10 per 1,000 searches + standard token costs
- **Web fetch**: No additional cost beyond tokens
- **Computer use**: +466-499 system prompt tokens + 735 input tokens per tool definition

## Cost Optimization Strategies

1. **Model Selection**: Use Haiku for simple tasks, Sonnet for complex reasoning
2. **Prompt Caching**: Reduce costs for repeated context
3. **Batch Processing**: 50% discount for non-time-sensitive tasks
4. **Long Context**: Only use when necessary (premium pricing >200K tokens)

## Implementation Notes for JoTrack

- **Primary Models**: Claude Sonnet 4.5 ($3/$15), Claude Haiku 4.5 ($1/$5)
- **Fallback**: Claude Sonnet 3.7 ($3/$15) for compatibility
- **Cost Tracking**: Monitor token usage in AI provider calls
- **UI Updates**: Display real-time cost estimates based on selected model

---

**Last Updated**: January 2025  
**Next Review**: When Anthropic updates pricing
