# Lyric tests descriptions

Quick description of what each test here is trying to accomplish and test for, all the rights go to their respective owners, the lyrics are just used to verify the software works as intended and is not meant to claim ownership of any of the songs included, no audios or copyrighted material other than the lyrics themselves are provided in this project. Because the lyrics are taken from google and publicly available pages, there is a chance that the lyrics presented here are not 100% true to what is said in the songs, in which case these files are only for testing purposes.

The purpose of these tests is to quickly verify the logic of the program is working as expected, this was particularly helpful when working on the project as it could rapidly verify if a change to the logic of the app broke any other portion of the project, this was very useful to ensure that the project could handle several types of scripts simultaneously with the same backend. If you are a developer seeking to implement a new feature, please run these tests with:
```
npm run test:e2e
```
Which will automatically run all the tests for you, the tests were generated with the ideal merging and auto-merging logic for a fast workflow, so if any of your changes break the tests, there is a non-zero chance that your changes negatively impact the project's functionality. Consider this before submitting a pull request.

## Brand New Day - BABYMETAL
This song uses a mix of English and Japanese Lyrics, using merges both on the XML and plain_text rows. This is probably the hardest test as it integrates both types of merges and 2 types of alphabets.

## Baba Yaga - Slaughter to Prevail
This song uses a mix of cyrilic and latin (english) vocals, testing the project's ability to work with both scripts, sometimes in the same lyric line.

## Rondo of Nightmare - BABYMETAL
This song is 100% in japanese, using hiragana, katakana and kanji. It is used to test pure japanese language capabilities.

## Ruszkik Haza - Ismeros Arcok
This song contains Hungarian lyrics, which uses an extended version of the latin script. This test contains no merge actions and its purpose is to test the smart auto-merge feature, verifying the backend correctly matches Hungarian lyrics to their counterparts without diacritics or accents.

## Unholy Confessions - Avenged Sevenfold
This song is entirely in English, and contains no merge actions whatsoever. The purpose of this song is to test the auto-merge feature without extended script usage.