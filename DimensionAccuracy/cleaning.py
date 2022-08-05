import json
import re
from tqdm import tqdm

import spacy
nlp = spacy.load("en_core_web_sm", disable=['ner', 'parser']) # disabling Named Entity Recognition for speed

depth = 10

data = []

for article_name in open("wiki-scrapper/articleNames.txt").readlines():
    for j in range(depth):
        f=open("wiki-scrapper/wiki/" + article_name.strip() + 'Articles/' + str(j) + '/bodytext.txt', encoding='utf-8')
        data.append(f.read())
        f.close()

f=open('wikicorpus.txt', 'w')

for row_num in tqdm(range(len(data))):
    words = []
    review = nlp(data[row_num])
    for token in review:
        if not token.is_stop:
            word = re.sub(r'[^a-zA-Z]', '', token.lemma_)
            word = word.lower()
            if word != '':
                words.append(word)
    if len(words) > 0:
         f.write(' '.join(words) + '\n')