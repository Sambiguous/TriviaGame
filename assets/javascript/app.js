var ansTimer;
var waiting = false;

//stores the categories and their associated number for use in building a url
categories = {}

//stores the id of the previously clicked button of a certain type
last_clicked = {
    cat: "placeholder",
    diff: "placeholder",
}

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
function fillCategories(){
    target = $("#categories")
    $.ajax({url: "https://opentdb.com/api_category.php", method: "GET"}).done(function(response){
        cat_list = response["trivia_categories"];
        for(i = 0; i < cat_list.length; i++){
            name = cat_list[i]["name"];
            categories[name] = cat_list[i]["id"];

            //topic_btn = $("<button type='button' class='btn cat-btn' onclick=round.setCat('" + categories[name] + "')></button>");
            topic_btn = $("<button type='button' class='btn cat-btn' id='cat" + i.toString() + "' onclick='catBtnPress(event)'></button>");
            topic_btn.data("cat", categories[name]);
            topic_btn.html(name);
            target.append(topic_btn);
        };
    });
};

function displayQuestion(question_object){
    //set 'q' equal to the question property of the question_object
    var q = question_object["question"]

    //set 'a' equal to the list of incorrect answers
    var a = question_object["incorrect_answers"];
    //set correct equeal to the correct_answer property of the question_object and push it into 'a'
    var ca = [question_object["correct_answer"]];
    round.answer = ca;

    //combine the two into a single array
    var ans_array = a.concat(ca);

    //randomize the ans_array
    shuffle(ans_array);

    //display 'q' in the #question <div>
    $("#question").html("<h2>" + q + "</h2>");

    //display the answers on the #ansx divs
    for(i = 0; i < ans_array.length; i++){
        var target_btn = $("#ans" + (i + 1).toString())
        target_btn.data("ans", ans_array[i]);
        target_btn.html("<h4>" + ans_array[i] + "</h4>");
    }
};

function roundOver(){
    $("#stats").html("<h3>Correct Answers: " + round.correct + "</h3>" +
                    "<h3>Incorrect Answers: " + round.incorrect + "</h3>");
    
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

    console.log(round);
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

        console.log(round);
};

function ansBtnPress(ev){//executes everytime an answer div is clicked
    //select the clicked dom element using the id
    var element = $("#" + ev.currentTarget.id)

    // set 'guess' equal to the data variable of the selected dom element
    var guess = element.data("ans");

    //see if the data variable is included in the wrong answer array
    if(!waiting){
        waiting = true;
        if(guess == round.answer){
            rightAnswer();
        }
        else{
            wrongAnswer(round.answer);
        }
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

    //MAKE THE FREAKING API CALL...FINALLY
    $.ajax({url: round_url, method: "GET"}).done(function(response){
        console.log(response["response_code"]);
        if(response["response_code"] == 0){
            round.setQandA(response["results"]);
            console.log(round.questions_and_answers);
            $("#overlay").hide();
            startTimer();
            displayQuestion(round.questions_and_answers[0]);
        }
        else{alert("I'm sorry, Open Trivia database is having trouble with that category right now, please select a different one")}
    });
};

function startTimer(){
    var anwer = round.questions_and_answers[round.q_index]["correct_answer"];
    var target = $("#timer")
    var timer = 30;
    target.html(timer.toString() + " seconds remaining");
    ansTimer = setInterval(function(){
        timer --;
        target.html(timer.toString() + " seconds remaining");
        if(timer < 1){wrongAnswer(round.answer)};
    }, 1000);
};

function resetRound(){
    round.category = "";
    round.difficulty = "";
    round.final_url = "";
    round.questions_and_answers = [];
    round.answer = "";
    round.correct = 0;
    round.incorrect = 0;
    round.q_index = 0;
};

function rightAnswer(){
    round.correct ++;
    round.q_index ++;
    clearInterval(ansTimer);
    $("#timer").html("That's Correct!");
    setTimeout(function(){
        waiting = false;
        if(round.q_index < round.questions_and_answers.length){
            startTimer();
            displayQuestion(round.questions_and_answers[round.q_index]);
        }
        else{
            roundOver()
        }
    }, 3000);
};

function wrongAnswer(ans){
    round.incorrect ++;
    round.q_index ++;
    clearInterval(ansTimer);
    $("#timer").html("Sorry, the correct answer was " + ans);
    setTimeout(function(){
        waiting = false;
        if(round.q_index < round.questions_and_answers.length){
            startTimer();
            displayQuestion(round.questions_and_answers[round.q_index]);
        }
        else{
            roundOver()
        }
        
    }, 3000);
};



//========this function is copied straight from stack overflow, it is used to shuffle an array =========
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
};


$(document).ready(function(){
    //generate session token for trivia database api url;
    session.getToken();

    //populate the #categories div
    fillCategories()

    //bind answer divs to ansBtnPress function
    $(".answer").on("click", function(ev){
        ansBtnPress(ev);
    });
});


