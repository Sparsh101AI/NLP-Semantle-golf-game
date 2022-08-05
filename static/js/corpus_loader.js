// Loads the precomputed corpus file/vector file

class corpus {
    constructor(words, words300) {
        this.words = words;
        this.vectors = []
        this.keys = []
        if (words300) {
            this.words300 = words300
            console.log('I am using the correct one')
        } else {
            this.words300 = this.words
        }
        var firstIter = true

        for (const [key, value] of Object.entries(this.words)) {
            if (firstIter) {
                var maxX = value[0]
                var minX = maxX
                var maxY = value[1]
                var minY = maxY
                firstIter = false
                this.vectors.push(value);
                this.keys.push(key);
            } else {
                this.vectors.push(value);
                this.keys.push(key);

                if (value[0] > maxX) {
                    maxX = value[0];
                }
                if (value[0] < minX) {
                    minX = value[0];
                }

                if (value[1] > maxY) {
                    maxY = value[1];
                }
                if (value[1] < minY) {
                    minY = value[1];
                }
            }
        }
        var domain = maxX - minX
        var range = maxY - minY
        var size = Math.max(domain, range)
        this.stretchFactor = 960 / size
        this.xTranslate = (1000 - this.stretchFactor * domain) / 2 - minX * this.stretchFactor
        this.yTranslate = (1000 - this.stretchFactor * range) / 2 - minY * this.stretchFactor



    };
    getVectors(_callback) {
        $.getJSON(this.Path, _callback);
    }
    // Gets the cosine similarity between two vectors (in the form of lists)
    getCosineSimilarityWords(word1, word2) { // https://stackoverflow.com/questions/51362252/javascript-cosine-similarity-function
        var vectorA = this.words300[word1]
        var vectorB = this.words300[word2]

        return this.getCosineSimilarity(vectorA, vectorB);
    };
    getCosineSimilarity(vectorA, vectorB) { // https://stackoverflow.com/questions/51362252/javascript-cosine-similarity-function
        var dotProduct = 0;
        var mA = 0;
        var mB = 0;
        for (var i = 0; i < vectorA.length; i++) {
            dotProduct += (vectorA[i] * vectorB[i]);
            mA += (vectorA[i] * vectorA[i]);
            mB += (vectorB[i] * vectorB[i]);
        }
        mA = Math.sqrt(mA);
        mB = Math.sqrt(mB);
        return (dotProduct) / ((mA) * (mB));
    };

    // https://math.stackexchange.com/questions/2874940/cosine-similarity-vs-angular-distance
    // https://www.nominal-animal.net/answers/dot-product-curves.svg
    // multiple vector comparison mappings all scaled from -1 <= f(x) <= 1
    getAngularDistance(vectorA, vectorB) {
        let cosValue = this.getCosineSimilarity(vectorA, vectorB)

        return 1 - 2 * Math.acos(cosValue) / Math.PI
    }
    getCubicDistance(vectorA, vectorB) {
        let cosValue = this.getCosineSimilarity(vectorA, vectorB)

        return 1 / 2 * cosValue + 1 / 2 * cosValue ** 3
    }
    getSquareRootDistance(vectorA, vectorB) {
        let cosValue = this.getCosineSimilarity(vectorA, vectorB)

        return 1 - Math.sqrt((1 - cosValue) * 2)
    }

    scaleVector(vector) {
        var newScaledVector = []
        newScaledVector.push(vector[0] * this.stretchFactor + this.xTranslate)
        newScaledVector.push(vector[1] * this.stretchFactor + this.yTranslate)
        return newScaledVector;
    }
    // Gets the cosine similarity between two strings that are in the corpus
    // Gets the closest words in the radius of the word
    getWordsInRadius(wordText, radius) {
        var wordVector = this.words[wordText];

        var closeWords = {};
        for (const [key, value] of Object.entries(this.words)) {
            var magnitudeX = Math.abs(wordVector[0] - value[0]);
            var magnitudeY = Math.abs(wordVector[1] - value[1]);
            if (key != wordText && (magnitudeX < radius) && (magnitudeY < radius)) {
                closeWords[key] = value;
            };
        };

        return closeWords;
    };
    // Gets a random word (string) in the corpus
    getRandomWord() {
        var randomKey = this.keys[this.keys.length * Math.random() << 0]
        console.log(randomKey);

        return randomKey;
    }
    getWordPosition(wordName) {
        if (wordName in this.words) {
            return this.words[wordName]
        } else {
            return undefined
        }
    }
    getDistance(vector1, vector2) {
        var difference = (new Vector(vector1[0], vector1[1])).subtract(new Vector(vector2[0], vector2[1]))
        return difference.getNorm()
    }
    // returns the 'n' nearest words
    getNClosestWords(wordVector, n) {
        let closestWords = [this.keys[0]]
        let distances = [this.getDistance(wordVector, this.vectors[0])]
        for (let i = 1; i < this.keys.length; i++) {
            var currentDistance = this.getDistance(wordVector, this.vectors[i])
            for (let j = 0; j < closestWords.length; j++) {
                if (currentDistance < distances[j]) {
                    closestWords.splice(j, 0, this.keys[i])
                    distances.splice(j, 0, currentDistance)
                    if (closestWords.length > n) {
                        closestWords.pop()
                        distances.pop()
                    }
                    break
                }
            }
        }
        return closestWords
    }
    getNSimilarWords(word, n) {
        let closestWords = [this.keys[0]]
        let distances = [this.getCosineSimilarityWords(word, this.keys[0])]
        for (let i = 1; i < this.keys.length; i++) {
            var currentSim = this.getCosineSimilarityWords(word, this.keys[i])
            for (let j = 0; j < closestWords.length; j++) {
                if (currentSim > distances[j]) {
                    closestWords.splice(j, 0, this.keys[i])
                    distances.splice(j, 0, currentSim)
                    if (closestWords.length > n) {
                        closestWords.pop()
                        distances.pop()
                    }
                    break
                }
            }
        }
        return closestWords
    }
}