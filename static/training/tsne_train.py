#used for tsne 

from sklearn.manifold import TSNE
import json
path = '../corpora/semantle_10k_vectors/'
file = open(path + '300Dnorm.json')
wv300 = json.loads(file.read())
word_list = []
vector_list = []
for word, vec in wv300.items():
    word_list.append(word)
    vector_list.append(vec)

reduced_vectors = TSNE(n_components=2).fit_transform(vector_list).tolist()
wv = {}
for i in range(len(word_list)):
    wv[word_list[i]] = reduced_vectors[i]

file = open(path +  '2Dnormtsne.json', 'w')
file.write(json.dumps(wv))
file.close()