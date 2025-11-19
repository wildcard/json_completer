# Hacker News Launch Post Drafts

## Version 1: Performance Focus

**Title**: Show HN: json_completer – Complete truncated JSON with O(n) streaming (10-50x faster)

**Body**:

Hi HN! We built json_completer, a Rust library that completes truncated JSON and provides O(n) incremental parsing for streaming applications.

**The problem**: You're streaming JSON from an LLM (GPT-4, Claude) and want to display partial results in real-time. The naive try-catch loop works but scales quadratically. For a 12 KB response, you end up processing 14.4 million characters instead of 12,000. Final chunks take 19-20ms each, making the UI feel sluggish.

**Our solution**: State management. Track what you've parsed, resume from where you left off, only process new data. Result: O(n) instead of O(n²), 10-50x speedup, sub-millisecond updates.

**Also handles**: AWS Lambda 6 MB limits, CloudWatch log truncation, API Gateway cutoffs, network failures.

The core is Rust (MIT licensed) with a CLI for universal language support. We're working on native Python, Go, and Ruby bindings.

Comprehensive benchmarks and integration tests in the repo. Would love feedback from anyone dealing with streaming JSON or infrastructure size limits!

GitHub: https://github.com/aha-app/json_completer

**Word count**: 178 words

---

## Version 2: Use Case Focus

**Title**: Show HN: json_completer – Fix truncated JSON from LLMs, Lambda limits, and timeouts

**Body**:

Hey HN! We made json_completer to handle a problem we kept hitting: JSON that gets cut off mid-transmission.

**Real scenarios we've seen**:

1. **LLM streaming**: GPT-4 returns `{"response": "The best way to` - you want to show it, but JSON.parse() fails. The naive try-catch loop works but creates O(n²) complexity (48 seconds for 12 KB vs our 2.4 seconds).

2. **AWS Lambda**: Your function returns 8 MB, Lambda truncates at 6 MB, API Gateway returns 502. With json_completer, clients recover 90%+ of the data instead of getting nothing.

3. **Log truncation**: Datadog splits at 900 KB, Splunk at 10 KB. Complete the JSON before ingestion → preserve structured fields for querying.

4. **Network failures**: Connection drops at 300 KB of a 500 KB response. Recover partial data instead of retrying from scratch.

Written in Rust for performance (10-50x faster than alternatives), with a CLI for any language. Native Python/Go/Ruby bindings coming in Q1 2025.

Would love feedback, especially from folks building LLM applications or hitting cloud provider limits!

**Word count**: 197 words

---

## Version 3: Technical Deep-Dive Hook

**Title**: Show HN: json_completer – Why naive JSON streaming is O(n²) and how we made it O(n)

**Body**:

Hi HN! I want to share a performance trap we discovered while building LLM streaming applications.

**The trap**: Streaming JSON with a try-catch loop seems simple:

```javascript
let buffer = '';
stream.on('data', chunk => {
  buffer += chunk;
  try { JSON.parse(buffer); } catch (e) {}
});
```

But it's O(n²). For a 12 KB response in 5-char chunks (2,400 iterations), you process 14.4 million characters. We measured 48 seconds total time vs 2.4 seconds with proper state management.

**The fix**: Track parsing state (tokens, context stack, position). Resume from where you stopped. Only process new characters. Result: O(n) complexity, 20x speedup, smooth UI.

We built json_completer in Rust to implement this properly. Also solves truncation from AWS Lambda limits (6 MB), CloudWatch logs (1 MB), network timeouts, etc.

Open source (MIT), with comprehensive benchmarks proving the O(n²) trap and our solution. CLI works with any language; native bindings for Python/Go/Ruby coming Q1 2025.

Would love to hear if others have hit this issue or have better approaches!

**Word count**: 191 words

---

## Version 4: Short & Direct

**Title**: Show HN: json_completer – Complete truncated JSON (Rust, 10-50x faster than alternatives)

**Body**:

We built json_completer to fix a common problem: JSON that gets cut off.

**Use cases**:
- LLM streaming (GPT-4, Claude) - show partial results without O(n²) lag
- AWS Lambda 6 MB response limit - recover data instead of 502 errors
- CloudWatch/Datadog log truncation - preserve structured fields
- Network timeouts - salvage partial data

**Why Rust**: 10-50x faster than pure JS/Python, O(n) incremental parsing, universal via CLI. Native bindings for Python, Go, Ruby coming Q1.

**Example**: `{"name": "Alice", "age":` → `{"name": "Alice", "age":null}`

Handles unclosed strings, arrays, objects, partial numbers, incomplete keywords. State management for streaming (only processes new data, not entire buffer).

MIT licensed, comprehensive tests and benchmarks in repo.

Feedback welcome!

**Word count**: 128 words

---

## Recommended Version & Timing

**Recommend**: **Version 2** (Use Case Focus)

**Why**:
- Leads with concrete, relatable problems
- Multiple use cases show broad applicability
- Performance numbers are compelling but not overwhelming
- Technical enough for HN but accessible
- 197 words (within HN sweet spot of 150-250)

**Alternative**: **Version 3** if you want to emphasize the technical insight (O(n²) trap is a great hook for HN's technical audience)

**Timing recommendations**:
- **Best days**: Tuesday, Wednesday (10am-2pm PT)
- **Avoid**: Monday (competitive), Friday afternoon (low traffic), weekends
- **Strategy**: Post early morning PT to catch both US and European audiences

---

## Suggested HN Comments to Prepare

Have these ready to respond quickly to common questions:

### Performance Methodology

> We measured using real LLM responses (12 KB from GPT-4) split into 5-character chunks to simulate token-by-token streaming. Naive try-catch: 48s total. json_completer incremental: 2.4s. Methodology and raw data: [link to TEST_RESULTS.md]

### vs jsonrepair

> jsonrepair is excellent for *syntax errors* (wrong quotes, trailing commas). json_completer handles *truncation* (cut off mid-stream). Different problems! You can use both: jsonrepair first (fix syntax), then json_completer (handle truncation).

### Why not just paginate / compress / prevent truncation?

> That's the ideal solution! Use json_completer when you CAN'T prevent truncation: third-party APIs (can't modify), LLM streaming (tokens arrive slowly by design), network failures (can't control), infrastructure limits (Lambda 6 MB is hard). It's insurance, not a crutch.

### Language bindings timeline

> CLI works today with any language (spawn process, JSON API). Native bindings (PyO3 for Python, CGO for Go, FFI for Ruby) are in development, targeting Q1 2025. Focusing on getting the core right first.

### Benchmark fairness

> We compared against: (1) naive try-catch loop (most common), (2) partial-json-parser (same problem domain, now archived), (3) jsonrepair (different domain but often compared). Used same hardware, same data, averaged 100 runs. Methodology is fully documented and reproducible.

---

## Post-Launch Engagement Strategy

1. **First hour**: Respond to every comment quickly (5-10 min response time)
2. **Technical questions**: Answer with code examples, link to docs
3. **Skepticism**: Provide benchmark methodology, invite to verify
4. **Feature requests**: Note them, create GitHub issues publicly
5. **"Why not X?"**: Acknowledge alternatives, explain tradeoffs (see COMPARISON.md)
6. **Share metrics**: If post gets traction, share download/star numbers in comments

---

## Metrics to Track Post-Launch

- HN points & rank
- GitHub stars (before: X, after 24h: Y, after 1 week: Z)
- Traffic to docs site
- npm downloads (when published)
- GitHub issues opened (engagement indicator)
- Comments sentiment (positive/skeptical/neutral)
- Follow-up blog posts or tweets mentioning json_completer

---

## Follow-Up Posts (if Version 2 does well)

1. **Week 2**: "Show HN: Interactive playground for json_completer" (when built)
2. **Month 1**: "json_completer: Python bindings now available" (when ready)
3. **Month 3**: "Case study: How Company X uses json_completer to handle 1M LLM requests/day"

---

## Additional Launch Channels

After HN, consider:

- **Reddit**: r/rust, r/node, r/python, r/programming (stagger by 24-48h)
- **Twitter/X**: Tag relevant accounts (@rustlang, framework maintainers)
- **Dev.to**: Cross-post intro blog as tutorial
- **This Week in Rust**: Submit link
- **Node Weekly**: Submit for newsletter
- **Product Hunt**: Consider 1 week after HN
- **LinkedIn**: Personal post from maintainers

---

**Final checklist before posting**:
- [ ] GitHub repo is public and README is polished
- [ ] All links in post work (test in private browsing)
- [ ] Documentation site is live (or link to GitHub docs)
- [ ] You can respond quickly for first 2-3 hours
- [ ] Have 3-5 prepared answers for common questions
- [ ] Analytics are set up to track traffic spike
- [ ] Team is aware and ready to help respond

---

Good luck with the launch! 🚀
