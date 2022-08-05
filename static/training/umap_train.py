#uses umap to train 2d vectors
import umap
import json
path = '../corpora/semantle_10k_vectors/'
file = open(path + '300Dnorm.json', 'r')
words300 = json.loads(file.read())
file.close()
word_list = []
vector_list = []
for word, vec in words300.items():
    word_list.append(word)
    vector_list.append(vec)
reducer = umap.UMAP()
reduced_list = reducer.fit_transform(vector_list).tolist()
words = {}
for i in range(len(word_list)):
    words[word_list[i]] = reduced_list[i]
    
file = open(path + '2Dnormumap.json', 'w')
file.write(json.dumps(words))
file.close()