# Testing the judge

## The judge prompt

I gave Claude the 2027 policy, the register and my pass rules. Then I pasted one letter at a time and asked:

> Use these pass rules. Answer each one yes or no. Then give one word: yes if every rule says yes, no if any says no.

## Agreement

- Claude agreed with me on: 17 of 20 letters

## Disagreements

| Letter | My label | Judge label | Who was right                                          |
| ------ | -------- | ----------- | ------------------------------------------------------ |
| B07    | yes      | no          | Me. The letter is fine. Claude said the tone was cold. |
| B16    | no       | yes         | Me. Claude did not check the register.                 |
| B19    | yes      | no          | Claude. The register says position 18, not 22.         |
