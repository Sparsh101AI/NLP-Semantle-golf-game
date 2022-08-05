function parseExpression(corpus, string) {
    string = string.replaceAll(" ", "")
    string = string.split(/([+\-()])/g);
    tempString = string.filter(word => word.search(/([+\-()])/g) === -1)

    function calculateExpression(index) {
        var temporaryString = [];
        for (var i = 0; i < string.length; i++) {
            if (typeof (string[i]) == "object") {
                temporaryString.push(string[i][index]);
            } else {
                temporaryString.push(string[i]);
            }
        }
        return math.evaluate(temporaryString.join(""))
    }
    var potentialOldPositions = {}
    var currentPosition = [0,0]
    for (var i = 0; i < string.length; i++) {
        if (string[i] != "+" && string[i] != "-" && string[i] != "(" && string[i] != ")" && string[i] != "") { 
            wordVector = corpus.getWordPosition(string[i]);
            if (wordVector != undefined) {
                if (i == 0){
                    arrowDirections.push({vector:wordVector, word: '+' +  string[i]})
                    currentPosition[0] = currentPosition[0] + wordVector[0]
                    currentPosition[1] = currentPosition[1] + wordVector[1]
                    let word = corpus.getNClosestWords([currentPosition[0], currentPosition[1]], 1)
                    potentialOldPositions[word] = corpus.scaleVector(corpus.getWordPosition(word))
                } else if (string[i-1] == '-'){
                    arrowDirections.push({vector: [-wordVector[0], -wordVector[1]], word:'-' + string[i]})
                    currentPosition[0] = currentPosition[0] - wordVector[0]
                    currentPosition[1] = currentPosition[1] - wordVector[1]
                    let word = corpus.getNClosestWords([currentPosition[0], currentPosition[1]], 1)
                    potentialOldPositions[word] = corpus.scaleVector(corpus.getWordPosition(word))
                }else{
                    arrowDirections.push({vector: wordVector, word: '+' + string[i]})
                    currentPosition[0] = currentPosition[0] + wordVector[0]
                    currentPosition[1] = currentPosition[1] + wordVector[1]
                    let word = corpus.getNClosestWords([currentPosition[0], currentPosition[1]], 1)
                    potentialOldPositions[word] = corpus.scaleVector(corpus.getWordPosition(word))
                } // I dont deal with brackets
                string[i] = wordVector;
            } else {
                arrowDirections = []
                return;
            }
        }
    }
    for (let [word,vec] of Object.entries(potentialOldPositions)){
        console.log(word)
        oldPositions[word] = vec
    }
    // to prevent repeat words such as "king" - "man" + "woman" == "king"
    let closestWords = corpus.getNClosestWords([calculateExpression(0), calculateExpression(1)], tempString.length + 1)
    let closestWord = ""

    for (let i = 0; i < tempString.length + 1; i++) {
        if (tempString.indexOf(closestWords[i]) === -1) {
            closestWord = closestWords[i]
            break
        }
    }

    return [closestWord];
}