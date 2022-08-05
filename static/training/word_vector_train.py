from nltk import sent_tokenize
import gensim
import re
from sklearn.manifold import TSNE
import json
import math

text_file_path = "300Dsemantle.json"
out300D_file = "../corpora/semantle_unlimited-vectors/300Dsemantle_norm.json"
out2D_file = '../corpora/semantle_unlimited-vectors/2Dsemantle.json'
train = False
dimensions = 2 # Max 4 (This is only for the dimension reduction algorithm t-SNE, if raw_dimensions = True then this will not be relevant)
raw_dimensions = False # If you do not want to reduce vectors using t-SNE (have more than the maximum 4 vectors), set to True
raw_dimension_size = 200 # The amount of dimensions that are given if raw dimensions is True (default 200)
normalize300 = False
def clean_text(
    string: str,
    punctuations=r'''!()-[]{};:'"\,<>/?@#$%^&*_~''') -> str:
    """
    A method to clean text
    """
    # Cleaning the urls
    string = re.sub(r'https?://\S+|www\.\S+', '', string)

    # Cleaning the html elements
    string = re.sub(r'<.*?>', '', string)

    # Removing the punctuations
    for x in string.lower():
        if x in punctuations:
            string = string.replace(x, "")

    # Converting the text to lower
    string = string.lower()

    # Cleaning the whitespaces
    string = re.sub(r'\s+', ' ', string).strip()

    return string

def generate_vectors_file(path, reduced_vectors, vocabulary):
    listed_vectors = reduced_vectors
    new_dict = {}
    for i in range(len(listed_vectors)-1):
        new_dict[[*vocabulary.keys()][i]] = listed_vectors[i]

    with open(path,"x", encoding='utf-8') as f:
        json.dump(new_dict, f, ensure_ascii=False, indent=4)
        f.close()
 
all_text = open(text_file_path, "r", encoding='utf-8').read().lower()
all_text = all_text.replace("\n", " ")
all_text = all_text.replace("\r", " ")
all_text = all_text.replace("\t", " ")
for i in range(10):
    all_text = all_text.replace("  ", " ")

all_text = clean_text(all_text)

token = sent_tokenize(all_text)

sentences = token

for i in range(len(sentences)):
    sentences[i] = sentences[i].replace(".", "")
    sentences[i] = sentences[i].split()

model = gensim.models.Word2Vec(sentences=sentences, vector_size=raw_dimension_size)

corpus = model.wv
vocabulary = corpus.key_to_index
vectors = corpus[vocabulary]

if normalize300:
    count = 0
    for vector in vectors:
        dim_sum = 0
        for dim in vector:
            dim_sum += dim ** 2

        vec_mag = math.sqrt(dim_sum)
        for i in range(len(vector)):
            vector[i] = vector[i]/vec_mag
            
        count +=1
        if count % 5000 == 0:
            print(count/len(vectors) * 100)

generate_vectors_file(out300D_file, vectors, vocabulary)

if raw_dimensions:
    vectors_reduced = vectors
else:
    vectors_reduced = TSNE(n_components=dimensions).fit_transform(vectors)

generate_vectors_file(out2D_file, vectors_reduced.tolist(), vocabulary)