import numpy as np
import csv
from scipy import stats
import json

def cosine(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

vec_file = open('wiki50.json', encoding='utf-8')
vecs = json.load(vec_file)

wordsim_file = open('combined.csv', encoding='utf-8')
wordsim = csv.reader(wordsim_file)

fields = next(wordsim)

cos_sims = []
human_sims = []

for row in wordsim:
    cos_sims.append(cosine(vecs[row[0]], vecs[row[1]]))
    human_sims.append(float(row[2]))

spearman = stats.spearmanr(cos_sims, human_sims)

spearman_file = open('spearmancoeffs.txt', 'w', encoding='utf-8')
spearman_file.write(spearman[0])