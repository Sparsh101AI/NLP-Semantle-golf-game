#theres just too much noise in tsne
import json
import math
import os
def get_cosine_similarity(vec1, vec2):
    dot_prod = 0
    norm1 = 0
    norm2= 0
    for i in range(len(vec1)):
        dot_prod += vec1[i] * vec2[i]
        norm1 += vec1[i] ** 2
        norm2 += vec2[i] ** 2

    norm1 == math.sqrt(norm1)
    norm2 = math.sqrt(norm2)
    return dot_prod/ (norm1 * norm2)

def get_distance(vec1, vec2):
    distance = 0
    for i in range(len(vec1)):
        distance += (vec1[i] - vec2[i]) ** 2
    
    return math.sqrt(distance)

def rbo(list1, list2, p=0.9):
   def helper(ret, i, d):
       l1 = set(list1[:i]) if i < len(list1) else set(list1)
       l2 = set(list2[:i]) if i < len(list2) else set(list2)
       a_d = len(l1.intersection(l2))/i
       term = math.pow(p, i) * a_d
       if d == i:
           return ret + term

       return helper(ret + term, i + 1, d)

   k = max(len(list1), len(list2))
   x_k = len(set(list1).intersection(set(list2)))
   summation = helper(0, 1, k)
   return ((float(x_k)/k) * math.pow(p, k)) + ((1-p)/p * summation)
path = '../corpora/semantle_10k_vectors/'
file = open(path + '2Dtsne.json')
wv2 = json.loads(file.read())
file.close()
wv300_path = path + '300D.json'
wv300 = {}
try:
    file = open(wv300_path, 'r')
    wv300 = json.loads(file.read())
    file.close()
except:
    for path in os.listdir(wv300_path):
        file = open(wv300_path + '/' + path)
        wv = json.loads(file.read())
        file.close()
        for word in wv:
            wv300[word] = wv[word]

words300 = []
words2 = []
targ_vec_2d = wv2['computer']
targ_vec_300d = wv300['computer']
for word in wv2:
    dist = get_distance(wv2[word], targ_vec_2d)
    similarity = get_cosine_similarity(wv300[word], targ_vec_300d)
    words300.append([word, similarity])
    words2.append([word, dist])

def get_index_1(word):
    return word[1]

words300.sort(key = get_index_1, reverse = True)
words2.sort(key = get_index_1)
#actually, we want to transform these lists
for i in range(len(words300)):
    words300[i] = words300[i][0]
    words2[i] = words2[i][0]
print(words300[:100], words2[:100])
print(rbo(words300[:100], words2[:100]))
#so now we want to sort all this by choosing some word as a reference. Lets say we choose computer as a reference word.
