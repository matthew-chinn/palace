$(document).ready(function(){
    //$('#header').fadeIn("1000");
    //$('#welcome').fadeIn("500");
    //$('#firstinstruction').removeClass("hidden");
    var instruction = 0;
    $('#next').click(function(){
        var temp = $('.activeInstruction');
        temp.removeClass("activeInstruction").addClass("hidden");
        temp.next().addClass("activeInstruction").removeClass("hidden");
        instruction++;
        
        if(instruction === 4)
        {
            skipToStart();
        }
        
    });
    $('#skip').click(skipToStart);
            
});

var skipToStart = function(){
    $('.activeInstruction').fadeOut("500").removeClass("activeInstruction");
    $('#welcome').fadeOut("500");
	$('#game').fadeIn("500").addClass("active").removeClass("hidden");
    initializeGame();
};

var cpuFacedown;
var playerFacedown;
var cpuHand;
var playerHand;
var playerFaceup;
var cpuFaceup;
//arrays contain num 1-52

var deck;
var pile;

var initializeGame = function(){
    resetAll();
    for(var i = 0; i < 6; i++) //deal 6 per hand, 3 per facedown pile
    {
		if(i < 3)
		{
			cpuFacedown.push(deck.pop());
			playerFacedown.push(deck.pop());
		}
        cpuHand.push(deck.pop());
        playerHand.push(deck.pop());
    }
    
    var numSelected = 0;
    makeCard(playerHand, "playerhand");
    $('*').off(); //reset all div event listeners for play again button

    $('.card').unbind("click").click(function(){
        if($(this).hasClass("selected"))
        {
            $(this).removeClass("selected");
            numSelected--;
        }
        else
        {
            $(this).addClass("selected");
            numSelected++;
        }
    });

    $('#startGame').click(function(){
        if(numSelected != 3)
        {
            $('#pickAgain').fadeIn("500");
        }
        else
        {
			$(this).fadeOut("500");
            $('#pickAgain').fadeOut("500");
            $('.selected > p').each(function(){
                var num = parseInt($(this).text());
				removeCard(playerHand, "playerhand", num);
				playerFaceup.push(num);
			}); 

            $('.selected').removeClass("selected");

            //player cards
            makeCard(playerFaceup, "playerfaceup");
            makeCard(playerFacedown, "playerfacedown", "facedown");

            //cpu cards
            makeCard(cpuHand, "cpuhand", "facedown");

			//choose cpu's faceup cards
			for(var i = 0; i < cpuHand.length; i++)
			{
				if(i < 3) //choose first three as default
				{
					cpuFaceup.push(cpuHand[i]);
				}
				else //switch out if there are better cards
				{
					var comp = cpuHand[i];
					for(var j = 0; j < cpuFaceup.length; j++)
					{
						if(compareCards(comp, cpuFaceup[j], "cpuAI") > 0)
						{
							var temp = cpuFaceup[j];
							cpuFaceup[j] = comp;
							comp = temp;
						}
					}
				}
			}
			$(cpuFaceup).each(function()
			{
				removeCard(cpuHand, "cpuhand", this);
			});
            makeCard(cpuFaceup, "cpufaceup");
            makeCard(cpuFacedown, "cpufacedown", "facedown");
            $('.start').fadeIn("500");
            $('#deck #remainingCards').text(deck.length);
            $('#chooseThree').fadeOut("500");
			gamePlay();
		}
    });
};

function gamePlay(){
    var whoStarts = Math.floor(Math.random() * 2);
    if(whoStarts === 0)
	    playerTurn();
    else  
        cpuTurn();
}

function playerTurn(){
    var cardsChosen = [];

    $('#playerfacedown').off();
    
	if(playerHand.length !== 0)
	{
        $('#playerfaceup').off();
        $('#playerhand').off();
		$('#playerhand').on('dblclick', '.card', function(){
            playerDblClick(this);
        });
		$('#playerhand').on('click', '.card', function(){
            cardsChosen = playerClick(this, cardsChosen);
        });
    }

    else if(playerFaceup.length !== 0)
    {
        $('.faceupdown').css("z-index", "1");
        $('#playerfaceup').off();
        $('#playerfaceup').on('dblclick', '.card', function(){
            playerDblClick(this);
        });
        $('#playerfaceup').on('click', '.card', function(){
            cardsChosen = playerClick(this, cardsChosen);
        });
    }

    else if(playerFacedown.length !== 0) //facedown cards
    {
        $('#playerfacedown').on('dblclick', '.card', function(){
            playerDblClick(this, FACEDOWN);
        });
        if(playerFacedown.length === 0 && playerHand.length === 0)
            winScreen();
    }

    $('#select').unbind("click").click(function(){
        if(cardsChosen.length > 0)
        {
            console.log("player push: " + getCardValue(cardsChosen[0]) + " " 
                + cardsChosen.length + "x");
            playCard(cardsChosen, PLAYER);
        }
    });

    $('#pickup').unbind("click").click(function(){
        $('#bomb').css("visibility", "hidden");
        if(pile.length !== 0)
            pickupPile(PLAYER);
    });

}

function cpuTurn(){
	if(cpuHand.length !== 0)
	{
        cpuPlayCard(cpuHand);
	}
    else if(cpuFaceup.length !== 0)
    {
        cpuPlayCard(cpuFaceup);
    }
    else if(cpuFacedown.length !== 0)
    {
        cpuPlayFacedownCard();
    }
    if(cpuFacedown.length === 0 && cpuHand.length === 0)
        loseScreen();
}

function cpuPlayFacedownCard()
{
    var num = Math.floor(Math.random() * cpuFacedown.length);
    var card= cpuFacedown[num];
    if(compareTopCard(card) >= 0)
    {
        playCard([card], 1, CPU);
        var prevMove = $('#cpumove').text();
        $('#cpumove').text(prevMove + " " +getCardValue(card)+ " (" + 1 + "x)");
    }
    else
    {
        pile.push(card);
        //var prevMove = $('#cpumove').text();
        //$('#cpumove').text(prevMove + " " +getCardValue(card)+ " (" + 1 + "x)");
        //$('#cpuMove').text("CPU picked up the pile");
        console.log("cpu pick up pile");
        removeCard(cpuFacedown, "cpufacedown", card);
        pickupPile(CPU);
    }

}


function cpuPlayCard(array)
{
    array.sort(function(a,b){return compareCards(a,b, "cpuAI")}); 
		//check worst cards first
        var i = 0;
        var card;
        var answers = [];
		for(i; i < array.length; i++)
		{
            card= array[i];
			if(pile.length === 0 || (compareTopCard(card) >= 0) )
            {
                answers.push(card);
				break; //this card is eligible
            }
		}
        //check if cpu has more than one
        if(answers.length === 1)
        {
            for(var j = i+1; j < i+4 && j<array.length; j++)         
            {
                var nextCard= array[j];
                if(compareCards(card, nextCard) === 0)
                {
                    console.log("cpu has more than one");
                    answers.push(array[j]);
                }
            }          
        }
		if(answers.length !== 0) //there is an eligible card
		{
            var cardPlayed = getCardValue(answers[0]);
            console.log("cpu push " + cardPlayed + " " + answers.length + "x");
            var prevMove = $('#cpumove').text();
            $('#cpumove').text(prevMove + " " + cardPlayed + 
                " (" + answers.length + "x)");
            playCard(answers, CPU);
            console.log("pile: " + pile.toString());
        }
		else
		{
			pickupPile(CPU);
		}
}

//cardsChosen is an array
function playCard(cardsChosen, who)
{
    var cardChosenValue = getCardValue(cardsChosen[0]);
    //clear cpu move if player goes
    if(who === PLAYER)
    {
        $('#cpumove').text("");
        $('#bomb').css("visibility", "hidden");
    }
    for(var i = 0; i < cardsChosen.length; i++)
    {
        pile.push(cardsChosen[i]);
    }
   
    for(var i = 0; i < cardsChosen.length; i++)
    {
        if(who === PLAYER)
        {
            if(playerHand.length > 0)
                removeCard(playerHand, "playerhand", cardsChosen[i]);
            else if(playerFaceup.length > 0)
                removeCard(playerFaceup, "playerfaceup", cardsChosen[i]);
            else
                removeCard(playerFacedown, "playerfacedown", cardsChosen[i]);
        }
        else
        {
            if(cpuHand.length > 0)
                removeCard(cpuHand, "cpuhand", cardsChosen[i]);
            else if(cpuFaceup.length > 0)
                removeCard(cpuFaceup, "cpufaceup", cardsChosen[i]);
            else
                removeCard(cpuFacedown, "cpufacedown", cardsChosen[i]);
        }
    }
    if(checkBomb())
    {
        cardChosenValue = '10'; //one of the tens
    }
    var repeat = false;
    switch(cardChosenValue)
    {
        case '10': bomb(who); repeat= true; break;
        case '2': repeat= true; break;
        default:
    }

    if(playerHand.length <= 3)
        $('#player').css("width", "300");
    if(cpuHand.length <= 3)
        $('#cpu').css("width", "300");
    redoPile();
    drawCard(who);

    if(repeat)
        repeatTurn(who);
    else
        switchTurn(who);

}

//card is the div of the card, cardsChosen is an array, 
function playerClick(card, cardsChosen)
{
    $('#startmsg').fadeOut("500");
    var cardChosen = parseInt($(card).children("p").text());
    var cardChosenValue = getCardValue(cardChosen);
    var prevCardValue;
    if(cardsChosen.length !== 0)
    {
        prevCardValue = getCardValue(cardsChosen[0]);
    }
    
    if(compareTopCard(cardChosen) >= 0) //this card is eligible
    {
        if(cardChosenValue !== prevCardValue) //diff card chosen
        {
            cardsChosen = [cardChosen];
            $('.selected').removeClass("selected");
            $(card).addClass("selected");
        }

        else //same card value chosen
        {
            if(cardsChosen.indexOf(cardChosen) === -1) //not already chosen
            {
                $(card).addClass("selected");
                cardsChosen.push(cardChosen);
            }
            else //already chosen
            {
                $(card).removeClass("selected");
                var index = cardsChosen.indexOf(cardChosen);
                cardsChosen.splice(index, 1);
            }
        }
    }
    return cardsChosen;
}

var FACEDOWN = true;
//hand: FACEDOWN if user is on their facedown cards, cardsrc for facedown cards
function playerDblClick(cardsrc, hand)
{
    $('#startmsg').fadeOut("500");
    var card = parseInt($(cardsrc).children("p").text());
    var cardValue= getCardValue(card);
    if(pile.length === 0 || (compareTopCard(card) >= 0) )
    {
        $('.selected').removeClass("selected");
        console.log("player push: " + cardValue + " " + "1x");
        playCard([card], PLAYER);
    }
    else if(hand === FACEDOWN)
    {
        pile.push(card);
        pickupPile(PLAYER);
        removeCard(playerFacedown, "playerfacedown", card);
    }
}

//does compareCards, taking the top card into account
function compareTopCard(card)
{
    if(pile.length === 0)
        return 1;
    var topCard = pile[pile.length-1];
    var topCardValue = getCardValue(topCard);
    if(topCardValue === '7')
    {
        return compareCards(card, topCard, "SEVEN");
    }
    else
    {
        return compareCards(card, topCard);
    }
}

function drawCard(who){
    if(deck.length > 0)
    {
        if(who === PLAYER)
        {
            if(playerHand.length < 3)
            {
                var temp = deck.pop();
                playerHand.push(temp);
                makeCard([temp], "playerhand");
            }
            if(playerHand.length < 3)
                drawCard(PLAYER);
        }
        else
        {
            if(cpuHand.length < 3)
            {
                var temp = deck.pop();
                cpuHand.push(temp);
                makeCard([temp], "cpuhand", "facedown");
            }
            if(cpuHand.length < 3)
                drawCard(CPU);
        }
        $('#deck #remainingCards').text(deck.length);
    }
}

function repeatTurn(who){
    if(who===PLAYER)
        playerTurn();
    else
        cpuTurn();
}

function switchTurn(who){
    if(who === PLAYER)
        cpuTurn();
    else
        playerTurn();
}

//checks if the top four cards are the same
function checkBomb()
{
    if(pile.length >= 4)
    {
        var compareValue = getCardValue(pile[pile.length-1]);
        for(var i = 2; i < 5; i++)
        {
            if(compareValue !== getCardValue(pile[pile.length - i]))
                return false;
        }
        console.log("four in a row");
        return true;
    }
    else
        return false;
}


//either a 10 or 4 of a kind
function bomb(who){
    console.log("bomb");
    //pile = [];
    pile.length = 0;
    redoPile();
    $('#bomb').css("visibility", "visible");
}

var PLAYER = true;
var CPU = false;
//who: either "PLAYER" or "CPU"
function pickupPile(who){
	if(who === PLAYER)
	{
        $('#cpumove').text("");
		makeCard(pile, "playerhand");
		playerHand = playerHand.concat(pile);
        if(playerHand.length > 3)
            $('#player').css("width", "400px");
  		pile=[];
		redoPile();
		cpuTurn();
	}
	else
	{
		makeCard(pile, "cpuhand", "facedown");
		cpuHand = cpuHand.concat(pile);
		pile=[];
		redoPile();
        $('#cpuMove').text("CPU picked up the pile");
		playerTurn();
	}
}

//replace the top card of the pile to be displayed
function redoPile(){
	$('#pile').empty();
	if(pile.length > 0)
	{
		var topCard = [ pile[pile.length-1] ];
		makeCard(topCard, "pile");
	}
	
}

var getRandomCard = function(){
    var num = Math.floor((Math.random()*52)+1);
    return num;
};

var shuffleDeck = function(){
    var deck = [];
    var count = 0;
    while(deck.length != 52)
    {
        var card = getRandomCard();
        if(deck.indexOf(card) === -1)
        {
            deck[count] = card;
            count++;
        }
    }
	/*for(var i = 0; i < 52; i++)
	{
		deck[i] = getCardValue(deck[i]);
	}*/
    return deck;
}

//array for the cards, what div to place card in
//cardClass: blank, "facedown"
var makeCard = function(array, divId, cardClass){
    for(var i = 0; i < array.length; i++)
    {
        div = document.getElementById(divId);
        var cardOutline = document.createElement("DIV"); //div for card
        var cardValue = document.createElement("P"); //p for card's value
		var card = document.createTextNode(array[i]);
        var cardImage = document.createElement("IMG"); //image for card
        var cardFacedown = document.createElement("IMG");

        cardValue.appendChild(card);
        cardOutline.appendChild(cardImage);
        cardOutline.appendChild(cardValue);
        cardOutline.appendChild(cardFacedown);
        div.appendChild(cardOutline);
        $(cardOutline).addClass("card");
        if(typeof cardClass !== "undefined")
        {
            //$(cardOutline).addClass(cardClass);
            $(cardImage).addClass("facedown");
        }
        $(cardFacedown).attr("src", "classic-cards/card_back.png");
        $(cardFacedown).css({
            width:"80px",
            height:"100px",
            zIndex:"1",
            position:"absolute"
        });
        var imgName = "classic-cards/" + array[i] + ".png";
        $(cardImage).attr("src", imgName);
        $(cardImage).css({
            width:"80px",
            height:"100px",
            zIndex:"2",
            position:"absolute"
        });

    }
}

//get the card value (2-10, J Q K A) given the number (1-52)
var getCardValue = function(num)
{
    var temp = Math.ceil(num / 4);
    switch(temp)
    {
        case 1: 
            temp = 'A';
            break;
		case 11:
			temp = 'J';
			break;
		case 12:
			temp = 'Q';
			break;
		case 13:
			temp = 'K';
			break;
		default:
			temp = temp.toString();
	}
	return temp;
}

//return numeric value (2-14) of a card, for face cards
//Ace returns 14 so that it is a higher number for comparisons
var getCardNumValue = function(card)
{
	switch(card)
	{
		case 'A':
			return 14;
		case 'K':
			return 13;
		case 'Q':
			return 12;
		case 'J':
			return 11;
		default:
			return parseInt(card);
	}
}


//array that cards are being removed from, divId of the div to modify, num of
//card to be removed
var removeCard = function(array, divId, num)
{
	var loc = array.indexOf(num);
	array.splice(loc, 1);

    if($('#' +divId+ ' img:first-child').hasClass("facedown"))
    {
		$('#'+divId).empty();
		makeCard(array, divId, "facedown");
    }
	else
	{
		$('#'+divId).empty();
		makeCard(array, divId);
	}
}

//returns 1 if last card is a higher value than the previous
//(unless prev == 7) or is a special card, else return -1
//misc represents any third parameter that may be used
var compareCards = function(last, prev, misc)
{
    //console.log(last +" + "+prev+" + "+misc); 
    last=getCardValue(last);
    prev=getCardValue(prev);

	if(last === prev)
		return 0;
	if(last === '2' || last === '7' || last === '10')
		return 1;
	if(typeof misc === "undefined") 
	{
		if(getCardNumValue(last) > getCardNumValue(prev))
        {
			return 1;
        }
		return -1;
	}
	else if(misc === "SEVEN")
	{
		if(getCardNumValue(last) < 7)
        {
			return 1;
        }
		return -1;
	}
	else if(misc === "cpuAI") //choosing cards for cpu 
	{
		if(prev === '2' || prev === '7' || last === '10')
			return -1; //don't override when checking special cards
		else if(getCardNumValue(last) > getCardNumValue(prev))
			return 1;
		else
			return -1;
	}
}

function loseScreen(){
    $('#lose').fadeIn("500");
    $('#playagain').fadeIn("500");
    $('#playagain').click(initializeGame);
}

function winScreen(){
    $('#win').fadeIn("500");
    $('#playagain').fadeIn("500");
    $('#playagain').click(initializeGame);
}
	
function resetAll(){
    deck = shuffleDeck();
    cpuFacedown = [];
    playerFacedown = [];
    cpuHand = [];
    playerHand = [];
    playerFaceup = [];
    cpuFaceup = [];
    pile = [];
    $('.cardholder').empty(); //clear divs
    $('#bomb').css("visibility", "hidden");
    $('#cpumove').text("");
    $('#chooseThree').fadeIn("500");
    $('#startGame').fadeIn("500");
    $('.start').css("display", "none");
    $('#playerhand').css("width", "300");
}


        
	


/*  Format for prototype functions
    Card.prototype.getValue = function(){
    return this.value;
}*/
