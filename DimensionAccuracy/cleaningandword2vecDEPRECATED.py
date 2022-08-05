from nltk import sent_tokenize
import gensim
import re
from sklearn.manifold import TSNE
import json

depth = 10
raw_dimension_size = 50

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
    listed_vectors = reduced_vectors.tolist()
    new_dict = {}
    for i in range(len(listed_vectors)-1):
        new_dict[[*vocabulary.keys()][i]] = listed_vectors[i]

    with open(path,"x", encoding='utf-8') as f:
        json.dump(new_dict, f, ensure_ascii=False, indent=4)
        f.close()

all_text = ""

for article_name in open("wiki-scrapper/articleNames.txt").readlines():
    for j in range(depth):
        f=open("wiki-scrapper/wiki/" + article_name.strip() + 'Articles/' + str(j) + '/bodytext.txt', encoding='utf-8')
        all_text = all_text + " " + f.read().lower()
        f.close()

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

generate_vectors_file("wiki" + str(raw_dimension_size) + ".json", vectors, vocabulary)