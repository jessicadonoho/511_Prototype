// Hover definitions (PRODUCT.md §5.4). Only appear on AI-changed lines.

export interface HoverDef {
  token: string
  definition: string
  example?: string
  /** Posted to the Ask tab when someone clicks "Explain simpler". */
  simpler: string
}

export const HOVERS: HoverDef[] = [
  {
    token: '.get',
    definition:
      "`dict.get(key, default)` returns the value for `key`, or `default` if the key isn't there, instead of crashing with a KeyError.",
    example: '{"a": 1}.get("b", 0)  # → 0',
    simpler:
      'Think of `.get` as asking politely: "Do you have this key? If not, just give me this backup value." So `counts.get(user, 0)` means "this user\'s count, or 0 if we haven\'t seen them yet."',
  },
  {
    token: 'counts = {}',
    definition: 'Creates an empty dictionary to store user → count pairs.',
    simpler: 'This is a blank tally sheet. Each user gets a row the first time they show up.',
  },
  {
    token: '.items()',
    definition: 'Gives you each (key, value) pair in a dictionary, so you can loop over or sort both together.',
    example: '{"maya": 3}.items()  # → [("maya", 3)]',
    simpler: 'It turns the dictionary into a list of pairs, like ("maya", 3), so each name stays with its count.',
  },
  {
    token: 'sorted',
    definition: "Returns a **new** sorted list; it doesn't change the original.",
    simpler: 'It makes a sorted copy. Your original stays exactly as it was.',
  },
  {
    token: 'key=',
    definition: 'Tells `sorted` *what* to sort by. Here: the count in each pair.',
    simpler: 'It answers "sort by what?" Here the answer is "by the number," not by the name.',
  },
  {
    token: 'lambda',
    definition: 'A tiny unnamed function written inline. `lambda pair: pair[1]` means "given a pair, return its second item."',
    simpler: 'A one-line function with no name. You use it when you only need it once, right here.',
  },
  {
    token: 'reverse=True',
    definition: 'Sort from highest to lowest instead of lowest to highest.',
    simpler: 'It flips the order, so the biggest number comes first.',
  },
  {
    token: '[:n]',
    definition: 'Slicing: take the first `n` items of the list.',
    example: '[5,4,3,2][:2]  # → [5, 4]',
    simpler: 'It means "give me the first n." With n = 3, you get the top three.',
  },
  {
    token: '<=',
    definition: '"Less than **or equal to**." Including equal changes who counts as overdue on the due date itself.',
    simpler: '`<` means "before." `<=` means "before or on." That one extra day decides whether a book due today is overdue.',
  },
]

export const hoverByToken = (token: string) => HOVERS.find((h) => h.token === token)
