#used to split a json file of word vectors into n groups
import json
path = '../corpora/semantle_unlimited_vectors/300Dnorm/'
n = int(input('how many files do you want to divide this file into?'))
file = open('../corpora/semantle_unlimited_vectors/300Dnorm.json', 'r')
wv = json.loads(file.read()) 
file.close()

def create_sub_file():
    global file_num
    global wv_sub
    file = open(path + 'sub' + str(file_num), 'w')
    file.write(json.dumps(wv_sub))
    file.close()
    wv_sub = {}
    file_num += 1

sub_size = len(wv)//n #obviously, it wont divide evenly, so ill put the remainder words in the first subgroup
remainder = len(wv) % n
wv_sub = {}
file_num = 0

for word, vec in wv.items():
    wv_sub[word] = vec
    if file_num == 0:
        if len(wv_sub) == remainder + sub_size:
            create_sub_file()

    elif len(wv_sub) == sub_size: 
        create_sub_file()