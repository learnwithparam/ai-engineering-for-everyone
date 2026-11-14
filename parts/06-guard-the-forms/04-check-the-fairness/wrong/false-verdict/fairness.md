# Fairness and disclosure

## Who could be treated worse

| Group                             | How it could happen                                              |
| --------------------------------- | ---------------------------------------------------------------- |
| Children with a disability        | The AI may read a health note as a reason to rank the form lower |
| Children with a long or rare name | The AI may misread the name and lose a field                     |

## How I would test it

Copy one form. Change only the name, and keep every other line the same. Run both and compare the two results. If
the order or the flags differ, the AI is using the name, which clause 11.1 bans.

## My swap test

- Form: 13
- Name swapped in: Tom Baker
- Same result: no

## What we tell families

An AI helped us read your form. A person in the office checked it and made the decision. If you disagree, you can
appeal, and this letter says how.

## What I saw

I swapped Zainab for a short name on form 13. Both replies flagged the missing date of birth in the same way. The
name did not change the result.
