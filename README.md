# Does testable science survive its own incentives? Interactive demo

Live: https://qnfo.github.io/paper-demo-unfalsifiability-ess/

Companion to [Institutionalized Unfalsifiability as an Evolutionarily Stable Strategy in Scientific Incentive Landscapes](https://papers.qnfo.org/papers/institutionalized-unfalsifiability-as-an-evolutionarily-stable-strategy-in-scien).
Sliders for the prediction reward, failure cost, story reward and accuracy; the replicator-equation trajectory with a 1,000-researcher
simulation overlaid; the accuracy-versus-reward policy lever; and a table that reproduces the paper's numbers.

Toy model, technology readiness level 2. Payoffs: testable = p*b - (1-p)*c, untestable = s.

```
node --test js/math.test.mjs      # paper values and simulation as assertions
python -m http.server 8000        # then open http://localhost:8000
```

MIT licence. Static site, no build, no tracking.
