#program for normalizing a word embedding. This doesnt seem to be doing anything . . .
import json
import math
path = '../corpora/semantle_10k_vectors/'
file = open(path + '300D.json')
wv = json.loads(file.read())
file.close()
count = 0
for vector in wv.values():
    dim_sum = 0
    for dim in vector:
        dim_sum += dim ** 2

    vec_mag = math.sqrt(dim_sum)
    for i in range(len(vector)):
        vector[i] = vector[i]/vec_mag
        
    count +=1
    if count % 5000 == 0:
        print(count/len(wv) * 100)

file = open(path + '300Dnorm.json', 'w')
file.write(json.dumps(wv))
file.close()