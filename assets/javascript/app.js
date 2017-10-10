var ansTimer;
var cooldown = false;

//stores the categories and their associated id for use in building a url
categories = {};

//stores the id of the previously clicked button of a certain type
last_clicked = {
    cat: "placeholder",
    diff: "placeholder",
};

//object that is passed as the parameter in an ajax call that returns a session token
tokenRequestData = {
    url: "https://opentdb.com/api_token.php?command=request",
    method: "GET",
    success: function(result){
        session.token = result;
    },
};

//stores the session token
session = {
    token: {},
    getToken: function(){
        $.ajax(tokenRequestData)
    },
};

//holds all the info important to the current round of trivia
round = {

    base_url: "https://opentdb.com/api.php?",
    amount: "amount=10",
    category: "",
    difficulty: "",
    type: "&type=multiple",
    final_url: "",
    questions_and_answers: [],

    answer: "",
    correct: 0,
    incorrect: 0,
    q_index: 0,

    setCat: function(cat){
        round.category = "&category=" + cat;
    },

    setDiff: function(diff){
        round.difficulty = "&difficulty=" + diff;
    },

    setQandA: function(QA_arr){
        round.questions_and_answers = QA_arr;
    },

    buildFinal_url: function(){
        round.final_url = round.base_url +
        round.amount +
        round.category +
        round.difficulty +
        round.type +
        "&token=" + session.token["token"]
        },
};

//================html changing functions====================
function fillCategories(){ //executes once per session on page load
    var target = $("#categories")
    $.ajax({url: "https://opentdb.com/api_category.php", method: "GET"}).done(function(response){
        cat_list = response["trivia_categories"];
        for(i = 0; i < cat_list.length; i++){

            //fill categories dict with the category names and id_numbers
            var name = cat_list[i]["name"];
            categories[name] = cat_list[i]["id"];

            //create new button, set button data variable, set button html, and append button to target
            var topic_btn = $("<button type='button' class='btn cat-btn' id='cat" + i.toString() + "' onclick='catBtnPress(event)'></button>");
            topic_btn.data("cat", categories[name]);
            topic_btn.html(name);
            target.append(topic_btn);
        };
    });
};

function displayQuestion(question_object){
    //set 'q' equal to the question property of the question_object
    var q = question_object["question"];

    //set 'a' equal to the list of incorrect answers
    var a = question_object["incorrect_answers"];

    //set 'ca' to the correct_answer property of the question_object and push it into 'a'
    var ca = [question_object["correct_answer"]];
    round.answer = ca;

    //combine a an ca into a single array
    var ans_array = a.concat(ca);

    //randomize the ans_array
    //this is done so that the right answer is in a rondom spot each time a question is displayed
    shuffle(ans_array);

    //display 'q' in the #question <div>
    $("#question").html("<h2>" + q + "</h2>");

    //loop through ans_array and display each answer on a seperate #ans <div> 
    for(i = 0; i < ans_array.length; i++){
        var target_btn = $("#ans" + (i + 1).toString())
        target_btn.data("ans", ans_array[i]);
        target_btn.html("<h4>" + ans_array[i] + "</h4>");
    };
};

function roundOver(){
    //display end-of-round stats on the jumbotron
    $("#stats").html("<h3>Correct Answers: " + round.correct + "</h3>" +
                    "<h3>Incorrect Answers: " + round.incorrect + "</h3>");

    //show overlay so user can start new round
    $("#overlay").show();
    resetRound();
};

//=======================BUTTON PRESS FUNCTIONS====================
function catBtnPress(ev){ //executes runs every time a category button is pressed
    //remove the selected class from the previously clicked category button
    $("#" + last_clicked.cat).removeClass("selected");
    
    //select dom element based on event.currentTarget.id and apply the 'selected' class
    var element = $("#" + ev.currentTarget.id);
    element.addClass("selected");
    
    //set the category property of the round object to the data variable of the pressed category button
    round.setCat(element.data()["cat"])

    //set last clicked.cat to the id of the button that was just clicked
    last_clicked.cat = ev.currentTarget.id;
};

function diffBtnPress(ev){//executes every time a difficulty button is pressed
        //remove the selected class from the previously clicked difficulty button
        $("#" + last_clicked.diff).removeClass("selected");

        //select dom element based on event.currentTarget.id and apply the 'selected' class
        var element = $("#" + ev.currentTarget.id);
        element.addClass("selected");

        //set difficulty property of the round object to the id of the pressed button
        round.setDiff(element.attr("id"));

        //set last clicked.diff to the id of the button that was just clicked
        last_clicked.diff = ev.currentTarget.id;
};

function ansBtnPress(ev){//executes everytime an answer div is clicked
    //select the clicked dom element using the id
    var element = $("#" + ev.currentTarget.id);

    // set 'guess' equal to the data variable of the selected dom element
    var guess = element.data("ans");

    
    if(!cooldown){
        cooldown = true;
        
        //check if guess is equal to the correct answer
        if(guess == round.answer){
            rightAnswer();
        }
        else{
            wrongAnswer(round.answer);
        };
    };
};

//=======================GAME FUNCTIONS===========================
function startRound(){
    //construct a url for the triva database based on the options selected
    round.buildFinal_url();

    //retrieve said url
    var round_url = round.final_url;

    //delete stats if they are there
    $("#stats").html("");

    //make api call that will return array of question/answer objects
    $.ajax({url: round_url, method: "GET"}).done(function(response){
        if(response["response_code"] == 0){
            round.setQandA(response["results"]);
            $("#overlay").hide();
            startTimer();
            displayQuestion(round.questions_and_answers[0]);
        }
        else{alert("Sorry, Open Trivia Database is having trouble with that category right now, please select a different one")};
    });
};

function startTimer(){
    var anwer = round.questions_and_answers[round.q_index]["correct_answer"];
    var target = $("#timer");
    var timer = 30;
    target.html(timer.toString() + " seconds remaining");
    ansTimer = setInterval(function(){
        timer --;
        target.html(timer.toString() + " seconds remaining");
        if(timer < 1){wrongAnswer(round.answer)};
    }, 1000);
};

function resetRound(){// resets round object back to default values
    round.category = "";
    round.difficulty = "";
    round.final_url = "";
    round.questions_and_answers = [];
    round.answer = "";
    round.correct = 0;
    round.incorrect = 0;
    round.q_index = 0;
};

function rightAnswer(){//executes every time user guesses a correct answer
    //increment appropriate round properties
    round.correct ++;
    round.q_index ++;

    //clear the answer timer
    clearInterval(ansTimer);

    //display message
    $("#timer").html("That's Correct!");

    //wait 3 seconds, then restart the answer timer and display next question
    setTimeout(function(){
        cooldown = false;
        if(round.q_index < round.questions_and_answers.length){
            startTimer();
            displayQuestion(round.questions_and_answers[round.q_index]);
        }
        else{
            roundOver();
        };
    }, 3000);
};

function wrongAnswer(ans){//executes every time user guesses an incorrect answer
    //increment appropriate round properties
    round.incorrect ++;
    round.q_index ++;

    //clear the answer timer
    clearInterval(ansTimer);

    //display message
    $("#timer").html("Sorry, the correct answer was " + ans);

    //wait 3 seconds, then restart the answer timer and display next question
    setTimeout(function(){
        cooldown = false;
        if(round.q_index < round.questions_and_answers.length){
            startTimer();
            displayQuestion(round.questions_and_answers[round.q_index]);
        }
        else{
            roundOver();
        };
        
    }, 3000);
};

//========Function copied from stack overflow. Uses dark magic to shuffle array=========
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    };
};

$(document).ready(function(){
    //generate session token for trivia database api url;
    session.getToken();

    //populate the #categories div
    fillCategories();

    //bind answer divs to ansBtnPress function
    $(".answer").on("click", function(ev){
        ansBtnPress(ev);
    });
});
