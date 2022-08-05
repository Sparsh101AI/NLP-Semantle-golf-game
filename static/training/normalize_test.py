#test whether our normalization actually makes sense. First test if the vectors are already normalized. then test if our normalized vectors are actually normalized
import json
import math
path = '../corpora/semantle_10K_vectors/'
file = open(path + '300D.json')
wv = json.loads(file.read())
file.close()
file = open(path + '300Dnorm.json')
wv_norm = json.loads(file.read())
file.close()
#so how can we check if the normalization worked? First, go through wv_norm and see that the vec magnitudes are all1 
max_norm = ''
min_norm = ''
for vector in wv_norm.values():
    dim_sum = 0
    for dim in vector:
        dim_sum += dim ** 2
    mag = math.sqrt(dim_sum)
    if max_norm == '' or mag > max_norm:
        max_norm = mag
    elif min_norm == '' or mag < min_norm:
        min_norm = mag
max = ''
min = ''
for vector in wv.values():
    dim_sum = 0
    for dim in vector:
        dim_sum += dim ** 2
    mag = math.sqrt(dim_sum)
    if max == '' or mag > max:
        max = mag
    elif min == '' or mag < min:
        min = mag
print(max,min) 
print(max_norm,min_norm)