// include main scripts here
const sizeModifier = 1.4;
var vec300 = {
    '../static/corpora/semantle_10k_vectors/2Dtsne.json' : ["../static/corpora/semantle_10k_vectors/300D.json", 0],
    '../static/corpora/semantle_25k_vectors/2Dtsne.json' : ["../static/corpora/semantle_25k_vectors/300D.json", 0]
} //path to 2d gives us name and number of files of 300d
const definitionsLimit = 10;
var ball
var target
var vectors
var modeVectors
let map;
let sandMap;
var secretWord;
var lastWord;
let modeInput = document.getElementById('modeInput');
var oldPositions = {}
var obstacleHints = [];
var moves = 0;
var setHolePosition = true;
var generateHints = true;
var showPercent = true;
var showBannedWords = false;
var generateHintsSetting = true;
var playDefinitionAudioAutomatically = false;
var arrowDirections = []
var newGame = false;
var endOfGameOverlay = false;
var bullseyeBuffer = [];
var smallerWords = false
var showOldWords = true;
var smartExpressions = false

function reload(vectors, vectors300) {
    $("#hintText").css({ "opacity": 0, "visibility": "hidden", "height": 0, "margin-bottom": 0 });

    arrowDirections = []
    oldPositions = {}
    bullseyeBuffer = []
    obstacleHints = []
    generateHints = true;
    moves = 0
    delete modeVectors;
    delete ball;
    delete target;

    $("#moves").text("0");
    $("#holeInOne").hide();
    $("#tempDefinition").remove();
    $("#definitionContainer").hide();
    $("#similarityBox").hide();

    modeVectors = new corpus(vectors, vectors300);
    lastWord = undefined;
    secretWord = modeVectors.getRandomWord();
    while (isBadWord(secretWord)) {
        secretWord = modeVectors.getRandomWord();
    }
    endOfGameOverlay = false;
    setHolePosition = true;

    ball.position.x = Math.floor(Math.random(20, width - 20) * 100)
    ball.position.y = width / 2
    ball.velocity = new Vector(0, 0);
}
$('#cosineBtn').click(function (){
    var word1 = document.getElementById('cosInput1').value.toLowerCase()
    var word2 = document.getElementById('cosInput2').value.toLowerCase()
    if (modeVectors.getWordPosition(word1) && modeVectors.getWordPosition(word2)){
        console.log(modeVectors.getCosineSimilarityWords(word1, word2))
    } else{
        console.log('no such word as one of these')
    }
})
$('#revealBtn').click(function (){
    var word = document.getElementById('revealInput').value.toLowerCase()
    var vec = modeVectors.getWordPosition(word)
    if (vec){
        var similarWords = modeVectors.getNSimilarWords(word, 30)
        var closeWords = modeVectors.getNClosestWords(vec, 30)
        console.log(closeWords)
        console.log(similarWords)
        for (let i = 0; i < 30 ; i ++){
            vec = modeVectors.scaleVector(modeVectors.getWordPosition(similarWords[i]))
            position = [similarWords[i], vec[0], vec[1]]
            oldPositions[similarWords[i]] = vec
        }
    } else{
        console.log('no such word as one of these')
    }
})
$('#showBtn').click(function () {
    for (const [word, vec] of Object.entries(modeVectors.words)) {
        scaledVec = modeVectors.scaleVector(vec, width)
        oldPositions[word] = scaledVec
    }
})
$("#modeInput").change(function () {
    var mode = modeInput.value
    if (mode in vec300) {
        $.getJSON(mode, function (vectors) {

            var vectors300 = {}
            if (vec300[mode][1] == 0){
                $.ajax({
                    url: vec300[mode][0],
                    async: false,
                    dataType: 'json',
                    success: function (vectors) {
                        for (const [word, vec] of Object.entries(vectors)) {
                            vectors300[word] = vec

                        }
                    }
                });
            } else{

                for (let i = 0; i < vec300[mode][1]; i++) {
                    $.ajax({
                        url: vec300[mode][0] + 'sub' + String(i) + '.json',
                        async: false,
                        dataType: 'json',
                        success: function (subVectors) {

                            for (const [word, vec] of Object.entries(subVectors)) {
                                vectors300[word] = vec

                            }
                        }
                    });
                }
            }

            reload(vectors, vectors300)
        })

    } else {
        $.getJSON(mode, function (vectors) {
            reload(vectors);
        });
        
    }
});

$.getJSON("../static/corpora/semantle_vectors/2DVectors.json", function (vectors) {
    modeVectors = new corpus(vectors);
    secretWord = modeVectors.getRandomWord();
    while (isBadWord(secretWord)) {
        secretWord = modeVectors.getRandomWord();
    }
});


$("#submitBtn").click(() => {
    let tempWord = getWord();
    if (isBadWord(tempWord)) {
        showError("Error: Inappropriate word detected");
    } else {
        lastWord = tempWord;
        guessWord();
    }
})
$("#wordInput").keypress((e) => {
    if (e.key == "Enter") {
        let tempWord = getWord();
        if (isBadWord(tempWord)) {
            showError("Error: Inappropriate word detected");
        } else {
            lastWord = tempWord;
            guessWord();
        }
    }
});

function takeShot(vector) {
    $("#similarityBox").fadeIn();

    let tempSim = 0

    if (modeVectors.getWordPosition(lastWord)) {
        tempSim = modeVectors.getCosineSimilarityWords(lastWord, secretWord);
    }

    print(Math.round(((tempSim + 1) / 2) * 10000) / 100 + "%");
    if (showPercent) {
        $("#similarity").text(Math.round(((tempSim + 1) / 2) * 10000) / 100 + "%");
    } else {
        $("#similarity").text(tempSim);
    }


    moves++;
    $("#moves").text(moves);
    ball.takeShotWithXY(vector)
    bullseyeBuffer = [vector.x, vector.y]
}

function showDefinition(word, noSynonyms) {
    $.getJSON("https://api.dictionaryapi.dev/api/v2/entries/en/" + word.toLowerCase(), function (data) {
        definition = data[0];

        $("#definitionText").empty();
        $("#definitionSynonyms").empty();
        $("#definitionAntonyms").empty();
        $("#definitionContainer").show();
        $("#definitionWord").text(definition.word);
        $("#definitionTextPronounce").text(definition.phonetic);

        var definitions = definition.meanings[0].definitions;
        for (var i = 0; i < definitions.length; i++) {
            if (i >= definitionsLimit) { break };
            var appendText = "<li>" + definitions[i].definition + "</li>"
            if (i <= 2) { appendText = "<strong>" + appendText + "</strong>" }
            $("#definitionText").append(appendText);
        }

        function processSynonymsAntonyms(HTMLClass, words, HTMLTitle, HTMLList) {
            words = [...new Set(words)];
            var newWords = [];
            for (var i = 0; i < words.length; i++) {
                if (modeVectors.keys.includes(words[i])) {
                    newWords.push(words[i]);
                }
            };
            words = newWords;
            if (words.length != 0 && !noSynonyms) {
                $(HTMLTitle).show();
                for (var i = 0; i < words.length; i++) {
                    if (isBadWord(words[i])) continue;

                    var appendText = '<button class="' + HTMLClass + '">' + words[i] + '</button>'
                    $(HTMLList).append(appendText);
                    $(HTMLList).off().on('click', function (event) {
                        lastWord = event.target.innerText.toLowerCase();
                        guessWord();
                    })
                }
            } else {
                $(HTMLTitle).hide();
            }
        }

        var synonyms = [];
        var antonyms = [];

        for (var i = 0; i < definition.meanings.length; i++) {
            synonyms.push(...definition.meanings[i].synonyms);
            antonyms.push(...definition.meanings[i].antonyms);
        }

        processSynonymsAntonyms("synonym", synonyms, "#synonymsTitle", "#definitionSynonyms");
        processSynonymsAntonyms("antonym", antonyms, "#antonymsTitle", "#definitionAntonyms");

        var player = $("#definitionAudioPlayer");

        if (definition.phonetics[0] && definition.phonetics[0].audio) {
            $("#definitonAudioSource").attr("src", definition.phonetics[0].audio);
            player[0].pause();
            player[0].load();

            if (playDefinitionAudioAutomatically) { player[0].oncanplaythrough = player[0].play() }

            player.show();
        } else {
            player.hide();
        };
    })
        .fail(function () { // word not found
            $("#definitionText").empty();
            $("#definitionSynonyms").empty();
            $("#definitionContainer").hide();
            if (noSynonyms) {
                $("#win").css("height", "33%")
            }
        })
}

function guessWord() {
    arrowDirections = []
    $("#hintText").css({ "opacity": 0, "visibility": "hidden", "height": 0, "margin-bottom": 0 });
    if (modeVectors.getWordPosition(lastWord) !== undefined) {
        var lastWordVectors = modeVectors.getWordPosition(lastWord)

        if ((typeof (lastWord) != "undefined") && (lastWordVectors !== undefined)) {
            var inputWordVectors = modeVectors.scaleVector(lastWordVectors, width)

            var newX = inputWordVectors[0];
            var newY = inputWordVectors[1];

            var vector = new Vector(newX, newY)

            $("#lastWord").text(lastWord);
            takeShot(vector)
            oldPositions[lastWord] = [vector.x, vector.y]
            showDefinition(lastWord);
        };

    } else if (lastWord) { //check if it is vector expression. 
        if (smartExpressions) {
            var wordString = parseSmartExpressions()
        } else {
            var wordString = parseExpression(modeVectors, lastWord);
        }

        if (wordString != undefined && lastWord !== "") {
            lastWord = wordString[0];
            var combinedVectors = modeVectors.scaleVector(modeVectors.getWordPosition(wordString))

            var vector = new Vector(combinedVectors[0], combinedVectors[1]);

            $("#lastWord").text(lastWord);
            takeShot(vector)
            oldPositions[lastWord] = [vector.x, vector.y]
            showDefinition(lastWord);
        } else {
            showError("Error: Unknown word or word expression!")
        };
    }
    $("#wordInput").val("");
}

$("#restartBtn").click(function () {
    reload(modeVectors.words, modeVectors.words300);
});

$("#playAgain").click(function () {
    reload(modeVectors.words, modeVectors.words300);
});

function getHint() {
    let hintMessage;
    if (lastWord == undefined || lastWord == null) {
        //this is the hint system we had before
        let hintWords = [];
        let maxSim = -1
        let maxHint = ''
        for (k in modeVectors.words) {
            let similarity = modeVectors.getCosineSimilarityWords(k, secretWord);
            if (similarity < 0.9 && similarity > 0.8) {  
                hintWords.push(k)
            }
            if (similarity > maxSim && similarity < 0.99) {
                maxHint = k
                maxSim = similarity
            }
        }
        if (hintWords.length == 0) {
            var hint = maxHint
            var s = maxSim
        } else {
            var hint = hintWords[Math.floor(hintWords.length * Math.random())];
            var s = modeVectors.getCosineSimilarityWords(hint, secretWord);
        }
        s = Math.round(((s + 1) / 2) * 10000) / 100 + "%";
        console.log(s)
        hintMessage = "Hint: " + hint + " is " + String(s) + " similar to the secret word";
    } else if (modeVectors.getWordPosition(lastWord)) {
        //this is the kind of hints that paul wants
        let highestScore = 0;
        let hint;
        for (k in modeVectors.words) {
            let targetSimilarity = modeVectors.getCosineSimilarityWords(k, secretWord);
            let guessSimilarity = modeVectors.getCosineSimilarityWords(k, lastWord);
            let score = targetSimilarity + guessSimilarity;
            if (score > highestScore) {
                highestScore = score;
                hint = k;
            }
        }

        highestScore = 0;
        let badHint;
        for (k in modeVectors.words) {
            let targetSimilarity = -0.5 * modeVectors.getCosineSimilarityWords(k, secretWord);
            let guessSimilarity = modeVectors.getCosineSimilarityWords(k, lastWord);
            let score = targetSimilarity + guessSimilarity;
            if (score > highestScore) {
                highestScore = score;
                badHint = k;
                console.log(k + ", " + targetSimilarity + ", " + guessSimilarity);
            }
        }

        let t = modeVectors.getCosineSimilarityWords(hint, secretWord);
        let g = modeVectors.getCosineSimilarityWords(hint, lastWord);
        let bt = modeVectors.getCosineSimilarityWords(badHint, secretWord);
        let bg = modeVectors.getCosineSimilarityWords(badHint, lastWord);
        t = Math.round(((t + 1) / 2) * 10000) / 100 + "%";
        g = Math.round(((g + 1) / 2) * 10000) / 100 + "%";
        bt = Math.round(((bt + 1) / 2) * 10000) / 100 + "%";
        bg = Math.round(((bg + 1) / 2) * 10000) / 100 + "%";
        hintMessage = "Hint: " + hint + " is " + String(t) + " similar to the secret word, and " + String(g) + " similar to " + lastWord + ". " + badHint + " is " + String(bt) + " similar to the secret word, and " + String(bg) + " similar to " + lastWord;
        //we can choose either, just implemented so that there was something that Paul asked for
    } else{
        console.log('please enter a valid guess first and then press hint button.')
    }







    $("#hintText").html("<i class='fa-solid'></i>" + hintMessage);

    let textHeight = 22;
    let charCount = $("#hintText").text().length;

    if (charCount > 250) textHeight = 88;
    else if (charCount > 160) textHeight = 66;
    else if (charCount > 100) textHeight = 44;

    $("#hintText").css({ "opacity": 1, "visibility": "visible", "height": textHeight + "px", "margin-bottom": "20px" });
    // i made hint dissappear when new word is guessed
}

$("#hintBtn").click(function () {
    getHint();
});
function renderArrows() { //https://p5js.org/reference/#/p5.Vector/magSq
    sf = canvas.width / map.width
    var oldHead = [0, 0]
    var scaledOldHead = [modeVectors.xTranslate * sf, modeVectors.yTranslate * sf]
    for (let i = 0; i < arrowDirections.length; i++) {
        push()
        //ok so we get this, now we want to draw it
        var newHead = [arrowDirections[i].vector[0] + oldHead[0], arrowDirections[i].vector[1] + oldHead[1]]
        var scaledNewHead = modeVectors.scaleVector(newHead)
        scaledNewHead = [scaledNewHead[0] * sf, scaledNewHead[1] * sf]
        vec = createVector(scaledNewHead[0] - scaledOldHead[0], scaledNewHead[1] - scaledOldHead[1])
        translate(scaledOldHead[0], scaledOldHead[1])
        line(0, 0, vec.x, vec.y)
        rotate(vec.heading())
        textAlign(CENTER, CENTER)
        textSize(30 * sf)
        text(arrowDirections[i].word, vec.mag() * 0.5, 10 * sf)
        translate(vec.mag() - 20 * sf, 0)
        triangle(0, 10 * sf, 0, -10 * sf, 20 * sf, 0)
        pop()
        oldHead = newHead
        scaledOldHead = scaledNewHead

    }
}
function renderOldWords() {
    if (smallerWords){
        var wordDiameter = 10 / map.width * canvas.width
    } else{
        var wordDiameter = ball.diameter / map.width * canvas.width
    }
    if (showOldWords == true) {
        for (let [word, vector] of Object.entries(oldPositions)) {
            if (word != lastWord) {
                fill(150);
                ellipse(vector[0] / map.width * canvas.width, vector[1] / map.height * canvas.height, wordDiameter, wordDiameter);
                
                if (dist(mouseX, mouseY, vector[0] / map.width * canvas.width, vector[1] / map.height * canvas.height) < ball.diameter / map.width * canvas.width) {
                    textSize(12);
                    text("(" + round(vector[0], 2) + ", " + round(vector[1], 2) + ")", (vector[0] / map.width * canvas.width), (vector[1] / map.height * canvas.height + (width / 25)) + 15);
                };

                fill(255);
                strokeWeight(3);
                stroke(0)
                text(word.toUpperCase(), vector[0] / map.width * canvas.width, vector[1] / map.height * canvas.height + (width / 25));
                
                textSize(width / 45);
                strokeWeight(1);
            }
        }
    }
}

function showError(errText) {
    $("#errorText").html("<i class='fa-solid fa-circle-exclamation'></i>" + errText);
    $("#errorText").css({ "opacity": 1, "visibility": "visible", "height": "22px", "margin-bottom": "20px" });
    setTimeout(() => {
        $("#errorText").css({ "opacity": 0, "visibility": "hidden", "height": 0, "margin-bottom": 0 });
    }, 5000)
}

function setup() {
    var canvas = createCanvas(windowWidth / sizeModifier, windowWidth / sizeModifier);
    windowResized();
    canvas.parent("canvasContainer");

    ball = new Ball(100, width / 2);
}

function draw() {
    background("#A1DF50");

    //showMapGrid();


    // hole should be drawn below everything else
    if (modeVectors != undefined) {
        secretVectors = modeVectors.scaleVector(modeVectors.getWordPosition(secretWord));
        var holex = secretVectors[0]
        var holey = secretVectors[1]


        if (setHolePosition) {
            ball.position = new Vector(Math.floor(Math.random() * (width - 10)) + 10, Math.floor(Math.random() * (width - 10)) + 10);
            let distx = Math.abs(holex - ball.position.x);
            let disty = Math.abs(holey - ball.position.y);

            while (distx < 100 || disty < 100) {
                ball.position = new Vector(Math.floor(Math.random() * (width - 20)) + 20, Math.floor(Math.random() * (width - 20)) + 20);
                distx = Math.abs(holex - ball.position.x);
                disty = Math.abs(holey - ball.position.y);
            }
            let inputFromGeneration = generateObstacles(Math.round(holex / 10), Math.round(holey / 10), Math.round(ball.position.x / 10), Math.round(ball.position.y / 10));
            map = inputFromGeneration[0];
            sandMap = inputFromGeneration[1];
            setHolePosition = false;
            console.log(ball.position.x, ball.position.y);
        }

        fill(219, 197, 107);
        for (let sand of sandMap.obstacles) {
            beginShape();
            for (let point of sand.polygon) {
                vertex(point.x / map.width * canvas.width, point.y / map.height * canvas.height);
            }
            endShape(CLOSE);
        }

        fill(48, 42, 35);
        for (let obstacle of map.obstacles) {
            beginShape();
            for (let point of obstacle.polygon) {
                vertex(point.x / map.width * canvas.width, point.y / map.height * canvas.height);
            }
            endShape(CLOSE);

            if (generateHints && generateHintsSetting) {
                let div = 50;
                let interval = Math.round(modeVectors.keys.length / (Math.floor(Math.random() * (div + 2)) + (div - 2)));
                if (interval == 0) {
                    interval = 1
                }
                for (let i = 0; i < modeVectors.keys.length; i += interval) {
                    let scaledVec = modeVectors.scaleVector(modeVectors.vectors[i], width);
                    let word = modeVectors.keys[i];
                    if (inside([scaledVec[0], scaledVec[1]], obstacle.polygon) && !isIntersecting(word, scaledVec[0], scaledVec[1])) {
                        if (!showBannedWords && !isBadWord(word)) {
                            obstacleHints.push([word, scaledVec[0], scaledVec[1], "white"]);
                        }
                    }
                }
            }
        }
        generateHints = false;

        textSize(width / 45);
        textAlign(CENTER);

        fill(255)
        for (let tempWord of obstacleHints) {
            strokeWeight(3);
            stroke(0);
            fill(tempWord[3])
            text(tempWord[0], tempWord[1] / map.width * canvas.width, tempWord[2] / map.height * canvas.height)
            strokeWeight(1);
        }


        renderOldWords();

        if ((Math.abs(ball.velocity.x) > 0.35 || Math.abs(ball.velocity.y) > 0.35) && (bullseyeBuffer != [])) {
            fill('rgb(255, 0, 0)')
            ellipse(bullseyeBuffer[0] / map.width * canvas.width, bullseyeBuffer[1] / map.height * canvas.height, canvas.width / 50, canvas.width / 50);
        }

        fill(0);
        ellipse(holex / map.width * canvas.width, holey / map.width * canvas.width, canvas.width / 25, canvas.width / 25);

        var circleCollisions = checkCircleCollision(ball.position.x / map.width * canvas.width, ball.position.y / map.height * canvas.height, holex / map.width * canvas.width, holey / map.width * canvas.width, (width / 25) / 2);
        if (circleCollisions != undefined && endOfGameOverlay == false) {
            // reload(modeVectors.words);
            if (moves <= 1) {
                $("#holeInOne").show();
            }
            $("#secretWord").text(secretWord);
            showOverlay(2);
            showDefinition(secretWord, true);
            $("#definitionContainer").clone().appendTo("#win").attr('id', 'tempDefinition');
            $("#definitionContainer").hide();
            endOfGameOverlay = true;
        } else {
            if (endOfGameOverlay) {
                stroke('rgba(0,0,0,0)');
                fill('rgba(0,0,0,0)');
            } else {
                fill(255);
            }
            ball.update();
            ball.display();
            if (endOfGameOverlay) stroke("black");
        };


        var poleWidth = width / 175;
        var poleHeight = width / 10;

        fill(255);
        rect(holex / map.width * width - poleWidth / 2, holey / map.width * width - poleHeight, poleWidth, poleHeight);

        let flagx = holex / map.width * width + (poleWidth / 2);
        let flagy = holey / map.width * width - poleHeight;

        fill(255, 0, 0)
        triangle(flagx, flagy, flagx, flagy + (width / 35), flagx + (width / 30), flagy + (width / 70));
        //draw the arrow stuff
        renderArrows()
    }
}

function inside(point, vs) {
    // ray-casting algorithm based on
    // https://github.com/substack/point-in-polygon
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

function windowResized() {
    // min width
    if (windowWidth / sizeModifier > 200 && windowHeight / sizeModifier > 200) {
        if (windowWidth < windowHeight) {
            resizeCanvas(windowWidth / sizeModifier, windowWidth / sizeModifier);
        } else {
            resizeCanvas(windowHeight / sizeModifier, windowHeight / sizeModifier);
        }
    } else {
        resizeCanvas(200, 200);
    }
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function showMapGrid() {
    let mapOfSand = getGrid();
    let obsMap = getObsGrid();
    let reduced = reduceGrid(obsMap);
    for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
            fill(0, 255, 0);
            rect(canvas.width / 100 * x, canvas.width / 100 * y, canvas.width / 100, canvas.width / 100)
            if (mapOfSand[y][x]) {
                fill(0, 0, 255, 200);
            }
            if (obsMap[y][x]) {
                fill(255, 0, 0, 200);
            }
            rect(canvas.width / 100 * x, canvas.width / 100 * y, canvas.width / 100, canvas.width / 100)
        }
    }

    for (let x = 0; x < 25; x++) {
        for (let y = 0; y < 25; y++) {
            if (reduced[y][x]) {
                fill(0, 0, 0, 200);
                rect(canvas.width / 25 * x, canvas.width / 25 * y, canvas.width / 25, canvas.width / 25);
            }
        }
    }
}

// settings liseners

$("#oldWordsSetting").change(() => {
    showOldWords = !showOldWords;
})

$("#showPercentSetting").change(() => {
    showPercent = !showPercent;
})

$("#showBannedSetting").change(() => {
    showBannedWords = !showBannedWords;
})

$("#audioAutoPlaySetting").change(() => {
    playDefinitionAudioAutomatically = !playDefinitionAudioAutomatically;
})

$("#generateHintsSetting").change(() => {
    if (generateHintsSetting) {
        generateHintsSetting = false;
        obstacleHints = [];
    } else {
        generateHintsSetting = true;
        generateHints = true;
    }
})
$('#smallerWords').change(() => {
    if (smallerWords) {
        smallerWords = false
    } else{
        smallerWords = true
    }
})
$('#smartExpressions').change(() => {
    if (smartExpression) {
        smartExpression = false
    } else{
        smartExpressions = true
    }
})

function thisFunctionIsCalledWhenAWordIsClicked(hintWord) {
    //hints for clicked visible words
    console.log(hintWord);
    let highestScore = 0;
    let hint;
    for (k in modeVectors.words) {
        let targetSimilarity = modeVectors.getCosineSimilarityWords(k, secretWord);
        let guessSimilarity = modeVectors.getCosineSimilarityWords(k, hintWord);
        let score = targetSimilarity + guessSimilarity;
        if (score > highestScore) {
            highestScore = score;
            hint = k;
        }
    }
    highestScore = 0;
    let badHint;
    for (k in modeVectors.words) {
        let targetSimilarity = -0.5 * modeVectors.getCosineSimilarityWords(k, secretWord);
        let guessSimilarity = modeVectors.getCosineSimilarityWords(k, hintWord);
        let score = targetSimilarity + guessSimilarity;
        if (score > highestScore) {
            highestScore = score;
            badHint = k;
            //console.log(k + ", " + targetSimilarity + ", " + guessSimilarity);
        }
    }

    //additive inverse - currently not used - pretty crappy
    highestScore = 0;
    let otherBadHint = 0;

    for (let i = 0; i < modeVectors.vectors.length; ++i) {
        let targetSimilarity = [modeVectors.vectors[i][0], modeVectors.vectors[i][1]];
        //console.log(targetSimilarity)
        targetSimilarity[0] *= -1;
        targetSimilarity[1] *= -1;
        let targetscore = modeVectors.getCosineSimilarity(targetSimilarity, modeVectors.getWordPosition(secretWord));
        let guessSimilarity = modeVectors.getCosineSimilarity(targetSimilarity, modeVectors.getWordPosition(hintWord));
        let score = targetscore + guessSimilarity;
        if (score > highestScore) {
            highestScore = score;
            otherBadHint = i;
            //console.log(k + ", " + targetSimilarity + ", " + guessSimilarity);
        }
    }

    //multiplicative inverse - currently not used - pretty crappy
    highestScore = 0;
    let mBadHint = 0;

    for (let i = 0; i < modeVectors.vectors.length; ++i) {
        let targetSimilarity = [modeVectors.vectors[i][0], modeVectors.vectors[i][1]];
        //console.log(targetSimilarity)
        //flip it
        //get magnitude
        let mag = Math.sqrt(targetSimilarity[0] * targetSimilarity[0] + targetSimilarity[1] + targetSimilarity[1])
        //angle
        let ang = Math.atan2(targetSimilarity[1], targetSimilarity[0])
        ang *= -1
        mag = 1 / mag
        let newv = [0, 0]
        newv[1] = Math.sin(ang) * mag
        newv[0] = Math.cos(ang) * mag
        newv = modeVectors.scaleVector(newv)

        let targetscore = -1 * modeVectors.getCosineSimilarity(targetSimilarity, modeVectors.getWordPosition(secretWord));
        let guessSimilarity = modeVectors.getCosineSimilarity(newv, modeVectors.getWordPosition(hintWord));
        let score = targetscore + guessSimilarity;
        if (score > highestScore) {
            highestScore = score;
            mBadHint = i;
            //console.log(k + ", " + targetSimilarity + ", " + guessSimilarity);
        }
    }
    let obw = modeVectors.keys[otherBadHint]
    let mbw = modeVectors.keys[mBadHint]

    let t = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(hint), modeVectors.getWordPosition(secretWord));
    let g = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(hint), modeVectors.getWordPosition(hintWord));
    let bt = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(badHint), modeVectors.getWordPosition(secretWord));
    let bg = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(badHint), modeVectors.getWordPosition(hintWord));
    let otb = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(obw), modeVectors.getWordPosition(secretWord));
    let oth = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(obw), modeVectors.getWordPosition(hintWord));
    let mtb = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(mbw), modeVectors.getWordPosition(secretWord));
    let mth = modeVectors.getCosineSimilarity(modeVectors.getWordPosition(mbw), modeVectors.getWordPosition(hintWord));

    t = Math.round(((t + 1) / 2) * 10000) / 100 + "%";
    g = Math.round(((g + 1) / 2) * 10000) / 100 + "%";
    bt = Math.round(((bt + 1) / 2) * 10000) / 100 + "%";
    bg = Math.round(((bg + 1) / 2) * 10000) / 100 + "%";
    otb = Math.round(((otb + 1) / 2) * 10000) / 100 + "%";
    oth = Math.round(((oth + 1) / 2) * 10000) / 100 + "%";
    mtb = Math.round(((mtb + 1) / 2) * 10000) / 100 + "%";
    mth = Math.round(((mth + 1) / 2) * 10000) / 100 + "%";

    hintMessage = "Hint: " + hint + " is " + String(t) + " similar to the secret word, and " + String(g) + " similar to " + hintWord + ". " + badHint + " is " + String(bt) + " similar to the secret word, and " + String(bg) + " similar to " + hintWord;
    hintMessage += ". Other bad hints are: '" + obw + "' - " + String(otb) + " to secret word, " + String(oth) + " to the hint word (additive inverse) and '" + modeVectors.keys[mBadHint] + "' - " + String(mtb) + " to secret word, " + String(mth) + " to the hint word (multiplicative inverse)"
    $("#hintText").html("<i class='fa-solid'></i>" + hintMessage);

    let textHeight = 22;
    let charCount = $("#hintText").text().length;

    if (charCount > 250 / canvas.width) textHeight = 88;
    else if (charCount > 160) textHeight = 66;
    else if (charCount > 100) textHeight = 44;

    $("#hintText").css({ "opacity": 1, "visibility": "visible", "height": textHeight + "px", "margin-bottom": "20px" });

}

function mouseClicked() {
    // console.log(mouseX, mouseY)
    for (let tempWord of obstacleHints) {
        if (mouseInsideText(tempWord[0], tempWord[1], tempWord[2])) {
            thisFunctionIsCalledWhenAWordIsClicked(tempWord[0]);
        }
    }
}

function mouseMoved() {
    for (let i = 0; i < obstacleHints.length; i++) {
        if (mouseInsideText(obstacleHints[i][0], obstacleHints[i][1], obstacleHints[i][2])) {
            obstacleHints[i][3] = "red";
            canvas.style.cursor = "pointer";
        } else if (obstacleHints[i][3] == "red") {
            obstacleHints[i][3] = "white";
            canvas.style.cursor = "default";
        }
    }
}

function mouseInsideText(message, x, y) {
    let width = textWidth(message);
    x = (x / map.width * canvas.width) - (width / 2);
    y = y / map.height * canvas.height;
    let top = y - textAscent();
    let bottom = y + textDescent();

    return mouseX > x && mouseX < (x + width) && mouseY > top && mouseY < bottom;
}

function wordsIntersecting(wrd1, x1, y1, wrd2, x2, y2) {
    let width1 = textWidth(wrd1);
    let width2 = textWidth(wrd2);
    x2 = (x2 / map.width * canvas.width) - (width2 / 2);
    y2 = y2 / map.height * canvas.height;
    let top = y2 - textAscent();
    let bottom = y2 + textDescent();

    return (x1 + (width1 / 2)) > x2 && (x1 - (width1 / 2)) < (x2 + width2) && y1 > top && (y1 - textAscent()) < bottom;
}

function isIntersecting(word, x, y) {
    let width1 = textWidth(word);
    x = x / map.width * canvas.width;
    y = y / map.height * canvas.height;

    for (temp of obstacleHints) {
        let width2 = textWidth(temp[0]);

        let x1 = (temp[1] / map.width * canvas.width) - (width2 / 2);
        let y1 = temp[2] / map.height * canvas.height;

        let top = y1 - textAscent();
        let bottom = y1 + textDescent();

        let intersectSides = (x + (width1 / 2) > x1) && (x - (width1 / 2) < x1 + width2);
        let intersectTopBottom = y > top && (y - textAscent()) < bottom;

        if (intersectSides && intersectTopBottom) return true;
    }

    return false;
}