// Practice questions for the lecture practice panel (Iteration 2, Theme 4).
//
// The loop is: the student types an answer, the LLM responds, and it repeats. Answers are
// free text, so every question carries scripted feedback for a right answer, for the
// near-misses we expect, and for anything else. A student needs 3 correct answers on a
// concept before the panel moves them on.

export const REPS_TO_ADVANCE = 3

export interface NearMiss {
  /** Lowercased substrings. The first matching entry wins. */
  triggers: string[]
  feedback: string
}

export interface LessonQuestion {
  id: string
  conceptId: string
  /** Shown above the question, so a student knows what kind of answer to give. */
  askFor: string
  prompt: string
  code?: string
  language?: 'python' | 'sql' | 'text'
  /** Lowercased substrings. Any one of them counts the answer as correct. */
  accept: string[]
  /** Answers that must NOT appear for a match to count (guards against "not 0"). */
  reject?: string[]
  correctFeedback: string
  nearMisses?: NearMiss[]
  wrongFeedback: string
  hint: string
}

export const LESSON_QUESTIONS: LessonQuestion[] = [
  // ---------- Dictionaries: .get() with a default ----------
  {
    id: 'lq-get-1',
    conceptId: 'dictget',
    askFor: 'Type the value it returns.',
    prompt: 'The first time `maya` appears, what does `counts.get(user, 0)` return?',
    code: 'counts = {}\nuser = "maya"\ncounts[user] = counts.get(user, 0) + 1',
    accept: ['0', 'zero'],
    reject: ['none', 'error', 'keyerror', '10'],
    correctFeedback:
      '`0` is right. `maya` is not in `counts` yet, so `.get` hands back the default you passed in. Then `0 + 1` stores `1`.',
    nearMisses: [
      {
        triggers: ['1', 'one'],
        feedback:
          'Close — `1` is what ends up *stored*, but the question is about what `.get` itself returns. It returns the default first, and the `+ 1` happens after. So what is the default here?',
      },
      {
        triggers: ['none', 'null', 'nothing'],
        feedback:
          '`None` is what you would get from `counts.get(user)` with no default. Here a second argument was passed in. Look at what that second argument is.',
      },
      {
        triggers: ['keyerror', 'error', 'crash'],
        feedback:
          'A `KeyError` is what `counts[user]` would raise. Avoiding exactly that crash is the reason to use `.get`. So what does `.get` give you instead?',
      },
    ],
    wrongFeedback:
      'Not quite. `.get(key, default)` takes two arguments: the key to look for, and what to return when that key is missing. `maya` is missing here, so look at the second argument.',
    hint: 'What is the second argument to `.get` for?',
  },
  {
    id: 'lq-get-2',
    conceptId: 'dictget',
    askFor: 'Name the method.',
    prompt: 'Which dictionary method looks up a key without crashing when the key is missing?',
    accept: ['.get', 'get('],
    correctFeedback: '`.get` is right. It returns your default instead of raising a `KeyError`.',
    nearMisses: [
      {
        triggers: ['[', 'bracket', 'index'],
        feedback:
          'Square brackets are the lookup that *does* crash on a missing key. There is a method that takes a fallback value instead. It is four characters long.',
      },
      {
        triggers: ['keys', 'setdefault', 'has_key', 'in'],
        feedback:
          'Not that one. `in` and `.keys()` can tell you whether a key exists, but we want a single call that returns either the value or a fallback.',
      },
    ],
    wrongFeedback: 'Not that one. It is the method you used in the counting pattern: `counts.____(user, 0) + 1`.',
    hint: 'It appears in the counting pattern from the notes: `counts.____(user, 0) + 1`.',
  },
  {
    id: 'lq-get-3',
    conceptId: 'dictget',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'stock = {"pens": 4}\nprint(stock.get("ink", 0))',
    accept: ['0', 'zero'],
    reject: ['none', 'keyerror', '40'],
    correctFeedback: '`0` is right. `"ink"` is not a key in `stock`, so `.get` returns the default.',
    nearMisses: [
      {
        triggers: ['4'],
        feedback:
          '`4` is the value stored under `"pens"`, but we asked for `"ink"`. Is `"ink"` in this dictionary at all? If not, which argument decides the result?',
      },
      {
        triggers: ['none', 'null'],
        feedback: 'That would be the answer with no default passed in. A default *was* passed here — look at the second argument.',
      },
      {
        triggers: ['keyerror', 'error'],
        feedback: 'No crash here. Dodging the `KeyError` is the whole point of `.get`. What does it return in its place?',
      },
    ],
    wrongFeedback: 'Not quite. Check whether `"ink"` is a key in `stock`, then look at what `.get` falls back on when it is not.',
    hint: 'Is `"ink"` one of the keys in `stock`?',
  },
  {
    id: 'lq-get-4',
    conceptId: 'dictget',
    askFor: 'Say what goes wrong.',
    prompt: 'Why does this crash on the very first record?',
    code: 'counts = {}\nfor record in records:\n    counts[record["user"]] += 1',
    accept: ['keyerror', 'key error', "doesn't exist", 'does not exist', 'not in', 'missing', 'no value', 'empty', 'nothing to add'],
    correctFeedback:
      'Exactly. `counts` starts empty, so there is no existing value to add `1` to, and `counts[key] += 1` raises a `KeyError`. `counts.get(key, 0) + 1` starts a new user at `0` instead.',
    nearMisses: [
      {
        triggers: ['records', 'loop', 'for'],
        feedback:
          'The loop itself is fine. Think about the dictionary on the line inside it: `counts` is empty when the first record arrives. What happens when you try to add `1` to a key that was never stored?',
      },
      {
        triggers: ['syntax', 'indent'],
        feedback: 'The syntax is valid — it runs and then fails at runtime. The problem is what `counts` holds when the first record arrives.',
      },
    ],
    wrongFeedback:
      'Not the issue here. `counts` is `{}` on the first pass, so `counts[user]` has no value yet. What error does Python raise when you read a key that is not there?',
    hint: 'What is in `counts` when the very first record arrives?',
  },
  {
    id: 'lq-get-5',
    conceptId: 'dictget',
    askFor: 'Type the finished line.',
    prompt: 'Rewrite this line so a brand new user starts at zero instead of crashing.',
    code: 'counts[user] += 1',
    accept: ['get(user, 0) + 1', 'get(user,0) + 1', 'get(user, 0)+1', 'get(user,0)+1'],
    correctFeedback:
      'That is the counting pattern: `counts[user] = counts.get(user, 0) + 1`. A new user comes back as `0`, and an existing one comes back as their running total.',
    nearMisses: [
      {
        triggers: ['get(user)'],
        feedback:
          'You are on `.get`, which is right. But with no second argument it returns `None`, and `None + 1` is its own error. What should a user you have never seen start at?',
      },
      {
        triggers: ['if', 'else', 'in counts'],
        feedback:
          'That works, and plenty of people write it that way. For this question, use the shorter one-line version the notes showed: `counts[user] = counts.____(user, 0) + 1`.',
      },
    ],
    wrongFeedback: 'Not yet. Keep the assignment to `counts[user]`, but get the current count with `.get` and a fallback of `0`.',
    hint: 'Fill in: `counts[user] = counts.____(user, ____) + 1`',
  },

  // ---------- dict.items() ----------
  {
    id: 'lq-items-1',
    conceptId: 'dictitems',
    askFor: 'Say what you get back.',
    prompt: 'What does `.items()` give you for `{"maya": 3}`?',
    accept: ['pair', 'key and value', 'keys and values', 'key, value', 'both', 'tuple', '("maya", 3)', 'maya", 3'],
    correctFeedback: 'Right — each key and value together as a pair, like `("maya", 3)`. That is why the name stays attached to its count.',
    nearMisses: [
      {
        triggers: ['key'],
        feedback: 'Keys alone are what `.keys()` gives you. `.items()` gives you more than that on each pass. What else comes along?',
      },
      {
        triggers: ['value'],
        feedback: 'Values alone are what `.values()` gives you. `.items()` keeps something attached to each value. What is it?',
      },
    ],
    wrongFeedback: 'Not quite. There are three similar methods: `.keys()`, `.values()` and `.items()`. The last one hands you both halves at once.',
    hint: 'Compare it to `.keys()` and `.values()`. What does the third one add?',
  },
  {
    id: 'lq-items-2',
    conceptId: 'dictitems',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'counts = {"maya": 3, "sam": 1}\nfor name, count in counts.items():\n    print(name, count)',
    accept: ['maya 3\nsam 1', 'maya 3 sam 1', 'maya3sam1', 'maya 3, sam 1'],
    correctFeedback: 'Right. Two lines: `maya 3` then `sam 1`. The loop unpacks each pair into `name` and `count`.',
    nearMisses: [
      {
        triggers: ['maya sam', 'maya, sam'],
        feedback: 'You have the names but not the counts. The loop unpacks *two* variables from each pair, and `print` is given both.',
      },
      {
        triggers: ['3 1', '3, 1'],
        feedback: 'Those are the counts without the names. Look again at the two variables in the `for` line — both are printed.',
      },
      {
        triggers: ['error', 'typeerror'],
        feedback: 'No error here. `.items()` yields pairs, and a `for` loop can unpack a pair into two variables directly.',
      },
    ],
    wrongFeedback: 'Not quite. Each pass takes one pair, puts the key in `name` and the value in `count`, then prints both separated by a space.',
    hint: 'The loop runs twice. What does `print(name, count)` show each time?',
  },
  {
    id: 'lq-items-3',
    conceptId: 'dictitems',
    askFor: 'Name the method.',
    prompt: 'You want to sort users by their count, highest first. Which method gets the names and counts out of the dictionary together?',
    accept: ['.items', 'items('],
    correctFeedback: '`.items()` is right. Sorting the pairs keeps each name attached to its count, which is exactly what a ranking needs.',
    nearMisses: [
      {
        triggers: ['values'],
        feedback: '`.values()` would give you the counts, but you would lose track of whose count is whose. You need the names to come along.',
      },
      {
        triggers: ['keys'],
        feedback: '`.keys()` gives you just the names, with no counts to sort by. You need both halves together.',
      },
      {
        triggers: ['sorted', 'sort'],
        feedback: '`sorted` does the ordering, yes — but the question is what you hand *to* `sorted`. Which dictionary method produces pairs?',
      },
    ],
    wrongFeedback: 'Not that one. There is a method that gives you pairs, so the name and the count travel together into `sorted`.',
    hint: 'You will pass the result straight into `sorted(...)`, so each name has to stay with its count.',
  },

  // ---------- Boundary conditions ----------
  {
    id: 'lq-bound-1',
    conceptId: 'boundary',
    askFor: 'Type the comparison.',
    prompt: 'Which comparison counts a book due **today** as overdue?',
    accept: ['<=', 'less than or equal'],
    reject: ['>='],
    correctFeedback: '`<=` is right. The `=` includes the boundary, so a due date equal to today counts as overdue.',
    nearMisses: [
      {
        triggers: ['<'],
        feedback: 'Careful — plain `<` means strictly before today, so a book due today would still be on time. You need the version that also includes the exact boundary.',
      },
      {
        triggers: ['>', '=='],
        feedback: 'That points the wrong way. Overdue means the due date is in the past, or is today. Which operator says "at or before"?',
      },
    ],
    wrongFeedback: 'Not quite. Compare `due < today` with `due <= today` and ask what each one does when `due` is exactly today.',
    hint: 'What does the `=` in `<=` add?',
  },
  {
    id: 'lq-bound-2',
    conceptId: 'boundary',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'score = 90\nprint(score > 90, score >= 90)',
    accept: ['false true', 'false, true'],
    correctFeedback: 'Right — `False True`. `>` leaves 90 out, `>=` includes it. Same number, different answer.',
    nearMisses: [
      {
        triggers: ['true true'],
        feedback: 'Only one of them is true. `score` is exactly 90, so ask whether 90 is *greater than* 90.',
      },
      {
        triggers: ['false false'],
        feedback: 'One of them is true. `>=` is satisfied by equality as well as by being greater.',
      },
      {
        triggers: ['true false'],
        feedback: 'Right idea, wrong order. The first comparison is `score > 90`, which is strict. Swap your two answers.',
      },
    ],
    wrongFeedback: 'Not quite. `score` is exactly 90. Take the two comparisons one at a time and decide each on its own.',
    hint: 'Is 90 greater than 90? Is 90 greater than or equal to 90?',
  },
  {
    id: 'lq-bound-3',
    conceptId: 'boundary',
    askFor: 'Say what goes wrong.',
    prompt: 'This should print each item, but it crashes on the last pass. What is wrong?',
    code: 'items = ["a", "b", "c"]\nfor i in range(len(items) + 1):\n    print(items[i])',
    accept: ['+ 1', '+1', 'one too', 'too far', 'past the end', 'out of range', 'off by one', 'index error', 'indexerror', 'extra'],
    correctFeedback:
      'Exactly. `range(len(items) + 1)` produces `0, 1, 2, 3`, but the last valid index is `2`, so `items[3]` raises an `IndexError`. Drop the `+ 1`.',
    nearMisses: [
      {
        triggers: ['print'],
        feedback: '`print` is fine. The trouble is the value of `i` on the final pass. How many numbers does `range(len(items) + 1)` produce, and what is the biggest index that actually exists?',
      },
      {
        triggers: ['len'],
        feedback: '`len(items)` is correct on its own — it is `3`. Look at what is being added to it, and at what the last valid index is.',
      },
    ],
    wrongFeedback:
      'Not the issue. `items` has 3 entries, so its indexes are `0`, `1`, `2`. Work out the last number `range(len(items) + 1)` hands you.',
    hint: 'List out every value of `i` the loop produces, then check which ones are valid indexes.',
  },

  // ---------- sorted() with key ----------
  {
    id: 'lq-sorted-1',
    conceptId: 'sortedkey',
    askFor: 'Type the argument.',
    prompt: 'Which argument makes `sorted` put the highest count first?',
    accept: ['reverse'],
    correctFeedback: '`reverse=True` is right. Without it, `sorted` runs lowest to highest.',
    nearMisses: [
      {
        triggers: ['key'],
        feedback: '`key` says *what* to sort by, not which direction. There is a separate argument for the direction.',
      },
      {
        triggers: ['desc', 'descending', 'high'],
        feedback: 'Right idea, but that is not Python\'s name for it. The keyword is a single English word meaning "flip the order".',
      },
    ],
    wrongFeedback: 'Not that one. `sorted` takes three things here: the items, `key=`, and one more argument that flips the direction.',
    hint: 'Fill in: `sorted(pairs, key=..., ____=True)`',
  },
  {
    id: 'lq-sorted-2',
    conceptId: 'sortedkey',
    askFor: 'Say what happens to the original list.',
    prompt: 'After you call `sorted(nums)`, what has happened to `nums` itself?',
    accept: ["doesn't change", 'does not change', 'unchanged', 'same', 'nothing', 'not modified', 'untouched', 'new list'],
    correctFeedback: 'Right. `sorted` returns a new list and leaves the original as it was. `nums.sort()` is the one that reorders in place.',
    nearMisses: [
      {
        triggers: ['sorted too', 'gets sorted', 'is sorted', 'reordered'],
        feedback: 'That is what `nums.sort()` does. `sorted(nums)` is the other of the pair — it hands something back rather than changing what you gave it.',
      },
      {
        triggers: ['empty', 'deleted'],
        feedback: 'Nothing is removed. The question is whether the original keeps its own order once `sorted` has run.',
      },
    ],
    wrongFeedback: 'Not quite. Python has two ways to sort: `nums.sort()` changes `nums`, and `sorted(nums)` does something different. What does `sorted` give you back?',
    hint: 'Python has `nums.sort()` and `sorted(nums)`. What is the difference between them?',
  },
  {
    id: 'lq-sorted-3',
    conceptId: 'sortedkey',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'words = ["kiwi", "fig", "banana"]\nprint(sorted(words, key=len))',
    accept: ['fig', "['fig', 'kiwi', 'banana']"],
    reject: ['banana\', \'fig', 'banana", "fig'],
    correctFeedback: "Right: `['fig', 'kiwi', 'banana']`. `key=len` sorts by length, so the shortest word comes first.",
    nearMisses: [
      {
        triggers: ['banana'],
        feedback: 'You have the right three words, but check the order. `key=len` sorts by length, ascending. Which of these words is shortest?',
      },
      {
        triggers: ['alphabet', 'kiwi'],
        feedback: 'Alphabetical is what you would get with no `key`. Here `key=len` replaces that. What is each word being compared by instead?',
      },
    ],
    wrongFeedback: 'Not quite. `key=len` means each word is compared by its length, in ascending order. The lengths are 4, 3 and 6.',
    hint: 'Write down each word\'s length first, then sort those numbers lowest to highest.',
  },

  // ---------- Lambda ----------
  {
    id: 'lq-lambda-1',
    conceptId: 'lambda',
    askFor: 'Say what it returns.',
    prompt: 'What does `lambda pair: pair[1]` give you when called with `("maya", 3)`?',
    accept: ['3', 'the count', 'second', 'value'],
    reject: ['maya'],
    correctFeedback: 'Right — `3`. It takes the pair and returns index `1`, the second item, which is the count.',
    nearMisses: [
      {
        triggers: ['maya', 'first', 'name', '0'],
        feedback: 'That is `pair[0]`. Python indexes from zero, so index `1` is the *second* item. Which half of `("maya", 3)` is that?',
      },
      {
        triggers: ['both', 'tuple', 'pair'],
        feedback: 'It returns just one of the two. The `[1]` picks a single item out of the pair.',
      },
    ],
    wrongFeedback: 'Not quite. The body is `pair[1]`, which indexes into the pair. Remember Python counts from `0`.',
    hint: 'In `("maya", 3)`, which item is at index `1`?',
  },
  {
    id: 'lq-lambda-2',
    conceptId: 'lambda',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'double = lambda x: x * 2\nprint(double(4))',
    accept: ['8'],
    correctFeedback: '`8` is right. The lambda is an ordinary function — it just has no name of its own.',
    nearMisses: [
      {
        triggers: ['44', '42'],
        feedback: 'That looks like `4` and `2` stuck together. `x * 2` multiplies, so with `x = 4` you get a single number.',
      },
      {
        triggers: ['6'],
        feedback: 'That would be `x + 2`. The body uses `*`, not `+`.',
      },
    ],
    wrongFeedback: 'Not quite. The lambda takes `x` and returns `x * 2`, and it is called with `4`.',
    hint: 'Substitute `4` for `x` in `x * 2`.',
  },
  {
    id: 'lq-lambda-3',
    conceptId: 'lambda',
    askFor: 'Say why.',
    prompt: 'Why would you write a `lambda` instead of a normal `def` function here?',
    code: 'ranked = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)',
    accept: ['once', 'one line', 'inline', 'short', 'small', 'no name', 'only need', 'single use', 'right there', 'single place'],
    correctFeedback:
      'Right. It is needed in exactly one place, so giving it a name and two more lines would not buy you anything. For anything longer or reused, a `def` is clearer.',
    nearMisses: [
      {
        triggers: ['faster', 'performance', 'quicker'],
        feedback: 'It is not about speed — the two run the same. Think about how many places in the program this function is needed.',
      },
      {
        triggers: ['required', 'have to', 'must'],
        feedback: 'It is not required. A named `def get_count(pair)` passed as `key=get_count` works identically. So the reason is about convenience — what kind?',
      },
    ],
    wrongFeedback:
      'Not the reason. A named function would work exactly the same here. Think about how many times this particular function is used in the program.',
    hint: 'How many places in this program need that function?',
  },

  // ---------- for loops ----------
  {
    id: 'lq-for-1',
    conceptId: 'forloops',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'total = 0\nfor n in [1, 2, 3]:\n    total += n\nprint(total)',
    accept: ['6'],
    correctFeedback: '`6` is right. The loop adds 1, then 2, then 3, keeping the running total between passes.',
    nearMisses: [
      {
        triggers: ['3'],
        feedback: '`3` is what you would get if `total` were reset inside the loop. Look at where `total = 0` sits — before the loop or inside it?',
      },
      {
        triggers: ['0'],
        feedback: '`total` does change: `+=` adds to it on every pass. Add the three values up by hand.',
      },
    ],
    wrongFeedback: 'Not quite. Walk the loop by hand and write down `total` after each pass: 1, then 3, then…',
    hint: 'Write down the value of `total` after each pass through the loop.',
  },
  {
    id: 'lq-for-2',
    conceptId: 'forloops',
    askFor: 'Say what goes wrong.',
    prompt: 'This should sum every grade, but it always returns the last one. What is wrong?',
    code: 'for grade in grades:\n    total = 0\n    total += grade',
    accept: ['inside', 'reset', 'resets', 'each time', 'every pass', 'every time', 'before the loop', 'outside', 'in the loop'],
    correctFeedback: 'Exactly. `total = 0` runs on every pass, wiping the running total. Move it above the loop so it is set just once.',
    nearMisses: [
      {
        triggers: ['+=', 'plus'],
        feedback: '`total += grade` is the right way to accumulate. The problem is the line just above it, and when that line runs.',
      },
      {
        triggers: ['return', 'print'],
        feedback: 'Not that. Look at `total = 0` and ask how many times it runs.',
      },
    ],
    wrongFeedback: 'Not the issue. Both lines are indented inside the loop, so both run on every pass. Is that right for `total = 0`?',
    hint: 'How many times does `total = 0` run?',
  },

  // ---------- List comprehensions ----------
  {
    id: 'lq-comp-1',
    conceptId: 'listcomp',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'print([n * 2 for n in [1, 2, 3] if n > 1])',
    accept: ['[4, 6]', '[4,6]', '4, 6', '4 6'],
    reject: ['2, 4, 6', '2,4,6'],
    correctFeedback: '`[4, 6]` is right. The `if` keeps 2 and 3, and each of those is doubled.',
    nearMisses: [
      {
        triggers: ['2, 4, 6', '2,4,6'],
        feedback: 'You doubled all three, but there is an `if` on the end. Which values of `n` survive `n > 1`?',
      },
      {
        triggers: ['[2, 3]', '[2,3]'],
        feedback: 'Those are the values that pass the filter, before the `n * 2` part is applied. One more step to go.',
      },
    ],
    wrongFeedback: 'Not quite. Filter first with `n > 1`, then double whatever is left.',
    hint: 'Apply the `if` first, then the `n * 2`.',
  },
  {
    id: 'lq-comp-2',
    conceptId: 'listcomp',
    askFor: 'Type the keyword.',
    prompt: 'Which keyword filters a comprehension down to only the matching items?',
    accept: ['if'],
    correctFeedback: '`if` is right. It goes at the end: `[b for b in books if b["due"] <= today]`.',
    nearMisses: [
      {
        triggers: ['for'],
        feedback: '`for` is what walks the sequence. The filtering is a separate keyword that comes after it.',
      },
      {
        triggers: ['where', 'filter', 'when'],
        feedback: 'That is the idea, but not Python\'s word for it. It is the same keyword you use for an ordinary condition.',
      },
    ],
    wrongFeedback: 'Not that one. It is the same two-letter keyword you use for a normal condition.',
    hint: 'It is the same keyword you use to write a plain condition.',
  },

  // ---------- Conditionals ----------
  {
    id: 'lq-if-1',
    conceptId: 'ifelif',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'pct = 85\nif pct >= 80:\n    print("B")\nelif pct >= 70:\n    print("C")',
    accept: ['b'],
    reject: ['b and c', 'bc', 'b, c'],
    correctFeedback: 'Just `B`. Python stops at the first true condition, so the `elif` is never even checked.',
    nearMisses: [
      {
        triggers: ['b and c', 'bc', 'b, c', 'both'],
        feedback: 'Only one branch runs. Once a condition is true, Python skips every `elif` and `else` below it.',
      },
      {
        triggers: ['c'],
        feedback: '`85 >= 70` is true, but Python checks the branches from the top. Which condition does it reach first?',
      },
      {
        triggers: ['nothing', 'none'],
        feedback: 'One branch does run: `85 >= 80` is true. What does that branch print?',
      },
    ],
    wrongFeedback: 'Not quite. Check the conditions from the top, and remember Python stops at the first one that is true.',
    hint: 'Does Python keep checking after a condition is true?',
  },
  {
    id: 'lq-bool-1',
    conceptId: 'boolops',
    askFor: 'Type True or False.',
    prompt: 'What is `True and False`?',
    accept: ['false'],
    reject: ['true'],
    correctFeedback: '`False` is right. `and` needs both sides to be true.',
    nearMisses: [
      {
        triggers: ['true'],
        feedback: 'That would be the answer for `or`, which only needs one side. `and` is stricter — how many sides must be true?',
      },
    ],
    wrongFeedback: 'Not quite. `and` is true only when both sides are true. One side here is `False`.',
    hint: 'How many sides does `and` need to be true?',
  },
  {
    id: 'lq-slice-1',
    conceptId: 'slicing',
    askFor: 'Type the output.',
    prompt: 'What does this print?',
    code: 'print([5, 4, 3, 2][:2])',
    accept: ['[5, 4]', '[5,4]', '5, 4', '5 4'],
    correctFeedback: '`[5, 4]` is right. `[:2]` starts at the beginning and stops before index 2.',
    nearMisses: [
      {
        triggers: ['[3, 2]', '[3,2]'],
        feedback: 'That is the *last* two. A slice with nothing before the colon starts at the beginning of the list.',
      },
      {
        triggers: ['[5, 4, 3]', '[5,4,3]'],
        feedback: 'One too many. The slice stops *before* index 2, so it does not include the item at index 2.',
      },
    ],
    wrongFeedback: 'Not quite. With nothing before the colon, the slice starts at index 0 and stops just before index 2.',
    hint: 'Which indexes does `[:2]` include?',
  },
  {
    id: 'lq-csv-1',
    conceptId: 'csvread',
    askFor: 'Say what you get per row.',
    prompt: 'What does `csv.DictReader` give you for each row of a file?',
    accept: ['dict', 'dictionary', 'keyed', 'column name', 'header'],
    correctFeedback: 'Right — a dictionary keyed by the column names from the header row, so you can write `row["title"]`.',
    nearMisses: [
      {
        triggers: ['list'],
        feedback: 'A plain list is what `csv.reader` gives you. The `Dict` in `DictReader` is a clue about what this one returns.',
      },
      {
        triggers: ['string', 'text'],
        feedback: 'It does more than hand back the raw line. The `Dict` in the name says what structure each row becomes.',
      },
    ],
    wrongFeedback: 'Not quite. The name is `DictReader`, and it uses the header row for something. What does each row become?',
    hint: 'The clue is in the name: `DictReader`.',
  },
]

export const questionsForConcept = (conceptId: string) => LESSON_QUESTIONS.filter((q) => q.conceptId === conceptId)

const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

export type Grade = 'correct' | 'near' | 'wrong'

export interface GradedResponse {
  grade: Grade
  feedback: string
}

/** Scripted grading for a free-text answer. Accept wins, then a near-miss, then the fallback. */
export function gradeResponse(q: LessonQuestion, raw: string): GradedResponse {
  const answer = normalize(raw)
  const rejected = (q.reject ?? []).some((r) => answer.includes(normalize(r)))
  if (!rejected && q.accept.some((a) => answer.includes(normalize(a)))) {
    return { grade: 'correct', feedback: q.correctFeedback }
  }
  for (const miss of q.nearMisses ?? []) {
    if (miss.triggers.some((t) => answer.includes(normalize(t)))) {
      return { grade: 'near', feedback: miss.feedback }
    }
  }
  return { grade: 'wrong', feedback: q.wrongFeedback }
}
