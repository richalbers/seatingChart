
// File: seatingChart.js
//
// Desc: logic for seatingChart.html. 
//
// Parameters (passed to webpage) 
//	  userName - Moodle UserName (matching name needs to be in associated google spreadsheet.  
//			If provided, shows seating chart in student view and allows student to click on seat.
//			If not provided, shows seating chart in instructor view and ignores seat selection.
//	e.g: seatingChart.html?class=CSxxx-xx&userName=xxxxxx  (userName is from Moodle: e.g. richa)
//
//  Note1: assocatiated google spreadsheet must contain sheet named the same as class argument.
//
//	Note2: Exact same userName must be in associated Google spreadsheet, along with full name
//  (that will appear on seating chart).  Any name provided to this script that is NOT in the
//	spreadsheet will not be added to the chart (done via the google script associated with the 
//	spreadsheet.)
//
$(document).ready(function() {
	const googleScriptURL="https://script.google.com/macros/s/AKfycbyM43MEJpqpyxzIlWsbcMuuUdSLe6R4yIRkk27TI8EMlTDWcMQ/exec"
	const frontLabelElement='<div id="frontLabel">Front of Room</div>';
	
	allowTabs('textarea');
	
	// class & section specify which sheet contains data on server
	var classSection=getUrlParameter("class");
	if (classSection == undefined)
		classSection="CS-161-01";
	
	//if userName was provided, configure student view, otherwise instructor view
	var userName=getUrlParameter("userName");
	var studentView=true;
	if (userName == undefined) {
		studentView=false;
		userName="instructor";
	}
		
	// Build Seating Chart HTML code (names are added later)
	var seatNum=1;
	for (var row=1; row<=3; row++){  
		$('#seats').append('<tr></tr>');
		for(var col=0; col<8; col++) {
			seatNumFwd='data-seatNumStuView="'+seatNum + '" ';
			seatNumBwd='data-seatNumInsView="'+(25-seatNum) + '" ';;
			classes='class="seat col'+(col+1)+'" ';
			$('#seats tr:last').append('<td ' + classes + seatNumFwd + seatNumBwd + '>' + '</td>');
			seatNum++;
		}
	}
	$(".col2, .col6").after('<td class="isle">isle</td>');
		
	//configure student view or instructor view
	if (studentView) {
		$('#seats').before(frontLabelElement);
		$('#answerSection').show();
		$('#answerListSection').hide();
	} else {	
		$('#seats').after(frontLabelElement);
		$('h2').hide();		
		$('#answerSection').hide();
		$('#answerListSection').show();
	}
	
	//Update seating chart with existing names (from server)
	getData( {'class': classSection }, function( data ) {
		updateSeatingChart( data );
	}); 	
	
	//-----------------------------------------------------
	// studentview event handlers
	
	if (studentView) {
		//if seat is clicked on, add student and reload data
		$('.seat').click(function() {
			var seatNum = $(this).attr("data-seatNumStuView");
			//alert(seat);
			if (userName != undefined)
				getData( {'class': classSection, 'userName':userName, 'seatNum':seatNum}, function( data ) {
					updateSeatingChart( data );
				});
		});
		
		//if answer textarea is modified, erase submit msg
		$('#answer').keyup(function() {
			$('#submitMsg').html("");
		});
		
		//if answer submit button is clicked, submit answer
		$('#submitButton').click(function() {
			var answer=$('#answer').val();
			if (userName != undefined) {
				getData( {'class': classSection, 'userName':userName, 'answer':answer}, function( data ) {
					updateSeatingChart( data );
				});
			};
		});
	} //studentView
	
	//-----------------------------------------------------------
	// instructorView event handlers
	else {
		//if seat is clicked, show only that answer	 TODO - IMPLEMENT
		$('.seat').click(function() {
			var dataAttrName="data-seatNumInsView";
			var seatNum = $(this).attr(dataAttrName); 
			var selector='#answers *[' + dataAttrName + '="' + seatNum + '"]';
			$(selector).removeClass('hidden');
		});
		
		//if getAswers button is clicked, fetch answers (but don't display)
		$('#getAnswersButton').click(function() {
			getData( {'class': classSection }, function( data ) {
				updateSeatingChart( data );
				loadAnswers( data );
				$('.answer').addClass('hidden');	
			});
		});
		
		//if showAswers button is clicked, fetch answers and display
		$('#showAnswersButton').click(function() {
			getData( {'class': classSection }, function( data ) {
				updateSeatingChart( data );
				loadAnswers( data );
				$('.answer').removeClass('hidden');
			});
		});
		
		//if clearAnswers button is clicked, eraseAnswers in database and screen
		$('#clearAnswersButton').click( function() {
			getData( {'class': classSection, 'clearAnswers': true }, function( data ) {
				updateSeatingChart( data );
				$("#answers").html("");
				$(".answerSubmitted").removeClass("answerSubmitted");
			});
		});//click
		
		// show author
		$('#answers').on("click", ".authorButton", function() {
			if ( $(this).html()=="Author" )
				$(this).html( $(this).attr("data-name") );
			else
				$(this).html("Author");
		});
		
		// hide answer
		$('#answers').on("click", ".hideButton", function() {
			$(this).parent().addClass("hidden");
		});
	}
	
	//=======================================================================
	// get data from server and pass it to callback for processing
	// args:
	//	args - an object (sent to server) containing one or more of the following:
	//		classSection - mandatory
	//		userName - required if seatNum or answer are given
	//		seatNum - assigns this seat to userName
	//		answer - assigns this answer to userName
	//		clearAnswers - erases answers for all users
	//	callback - routine to process data (array of student info) returned from ajax call.
	//=======================================================================
	function getData( args, callback ) {
		$('#dataLoadMsg').html("Processing...");
		$.ajax({
			url: googleScriptURL,
			data: args,
			type: 'POST',
			dataType: 'json'
		})    
		.done(function( data ) {
			callback(data);
			$('#dataLoadMsg').html("");		
		})
		.fail(function(data){
			$('#dataLoadMsg').html("Error - reload Page.");
		});
	}
	
	//=======================================================================
	//update Seating chart
	function updateSeatingChart( data ) {
		//update seating chart 
		var dataAttrName;
		if (studentView) 
			dataAttrName='data-seatNumStuView';
		else 
			dataAttrName='data-seatNumInsView';
		$('.seat').html(""); 
		for (var ndx=0; ndx<data.length; ndx++) {
			var selector='*[' + dataAttrName + '="' + data[ndx].seat + '"]';
			$(selector).html(data[ndx].fullName);
		}
	}
	
	//=======================================================================
	//load answers
	function loadAnswers( data ) {
		$("#answers").html("");
		$(".answerSubmitted").removeClass("answerSubmitted");
		
		var dataAttrName;
		if (studentView) 
			dataAttrName='data-seatNumStuView';
		else 
			dataAttrName='data-seatNumInsView';
			
		data.sort(function(a, b){
			var x = a.answer.toLowerCase();
			var y = b.answer.toLowerCase();
			if (x < y) {return -1;}
			if (x > y) {return 1;}
			return 0;
		});
			
		for (var ndx=0; ndx<data.length; ndx++)  {
			if (data[ndx].answer != "") {
				//add answer to list (hidden for now)
				var answer = formatAsHtml(data[ndx].answer);
				var dataAttr=dataAttrName + '="'+data[ndx].seat + '" ';;
				$("#answers").append('<div class="answer hidden"' + dataAttr + '>'
					+ answer
					+ '<button class="hideButton">Hide</button>'
					+ '<button class="authorButton" data-name="' + data[ndx].fullName +'">Author</button>'
					+ '</div>');
				//denote seat/user that submitted answer
				var selector='#seats *[' + dataAttrName + '="' + data[ndx].seat + '"]';
				$(selector).addClass("answerSubmitted"); 
			}
		}	
		
	}
	//========================================================================
	//format as html
	function formatAsHtml(s1) {
		var s2=s1.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
		var s3=s2.replace(/\n/g, "<br>");
		return(s3); 
	}
	
	//========================================================================
	//allow tabs in textarea
	function allowTabs(elementSelector) {
		$(document).delegate(elementSelector, 'keydown', function(e) {
			var keyCode = e.keyCode || e.which;

			if (keyCode == 9) {
				e.preventDefault();
				var start = $(this).get(0).selectionStart;
				var end = $(this).get(0).selectionEnd;

				// set textarea value to: text before caret + tab + text after caret
				$(this).val($(this).val().substring(0, start)
					+ "\t"
					+ $(this).val().substring(end));

				// put caret at right position again
				$(this).get(0).selectionStart =
				$(this).get(0).selectionEnd = start + 1;
			}
		});
	}
	
	//========================================================================
	//get specified URL parameter
	function getUrlParameter(sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1)),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : sParameterName[1];
			}
		}
	}

});