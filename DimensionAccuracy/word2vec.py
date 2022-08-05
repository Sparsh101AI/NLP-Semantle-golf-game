import gensim
import json

dimensions = 50  

def generate_vectors_file(path, vectors, vocabulary):
    listed_vectors = vectors.tolist()
    new_dict = {}
    for i in range(len(listed_vectors)-1):
        new_dict[[*vocabulary.keys()][i]] = listed_vectors[i]

    with open(path,"x", encoding='utf-8') as f:
        json.dump(new_dict, f, ensure_ascii=False, indent=4)
        f.close()

sentences = gensim.models.word2vec.LineSentence("wikicorpus.txt")
for dimensions in range(50, 601, 50):
    model = gensim.models.Word2Vec(sentences=sentences, vector_size=dimensions)

    corpus = model.wv
    vocabulary = corpus.key_to_index
    vectors = corpus[vocabulary]


    generate_vectors_file("wiki" + str(dimensions) + ".json", vectors, vocabulary)