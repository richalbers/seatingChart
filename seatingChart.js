
// File: seatingChart.js
//
// Desc: logic for seatingChart.html. 
//
// Parameters (passed to webpage) 
//	  stuId - Moodle UserName (matching name needs to be in associated google spreadsheet.  
//			If provided, shows seating chart in student view and allows student to click on seat.
//			If not provided, shows seating chart in instructor view and ignores seat selection.
//	e.g: seatingChart.html?stuId=userName  (from Moodle)
//
//	Note: Exact same userName must be in associated Google spreadsheet, along with full name
//  (that will appear on seating chart).  Any name provided to this script that is NOT in the
//	spreadsheet will not be added to the chart (done via the google script associated with the 
//	spreadsheet.)
//
$(document).ready(function() {
	var frontLabelElement='<div id="frontLabel">Front of Room</div>';
		
	// Build Seating Chart HTML code (with numbers in place of names)
	$('#chart').append('<table id="seats"></table>');
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
		
	//if student id was provided, configure student view, otherwise instructor view
	var stuId=getUrlParameter("stuId");
	var view;
	if (stuId == undefined) {
		view='I';
		$('#chart table:last').after(frontLabelElement);
		$('h2').hide();
	} else {	
		view='S';
		$('#chart').prepend(frontLabelElement);	
	}
	insertStudent("nobody", 0);	
	
	//if seat is clicked on, add student and reload data
	$('.seat').click(function() {
		if (view=='S') {
			var seatNum = $(this).attr("data-seatNumStuView");
			//alert(seat);
			if (stuId != undefined)
				insertStudent(stuId, seatNum);
		}
	});

	//insert given student into list, then fetch new list and update screen
	function insertStudent(stuId, seatNum) {
		$('#msg').show();
		$.ajax({
			url: 'https://script.google.com/macros/s/AKfycbyM43MEJpqpyxzIlWsbcMuuUdSLe6R4yIRkk27TI8EMlTDWcMQ/exec',
			data: {
				'stuId': stuId,
				'seatNum': seatNum			
			},
			type: 'POST',
			dataType: 'json'
			//error: alert("Error occurred!"),
			//success: $('body').append('<div>insert successful</div>')
		})    
		.done(function( data ) {
			var dataAttrName;
			if (view=='I') 
				dataAttrName='data-seatNumInsView';
			else 
				dataAttrName='data-seatNumStuView';
			for (var ndx=0; ndx<data.length; ndx++) {
				var selector='*[' + dataAttrName + '="' + data[ndx].seat + '"]';
				$(selector).html(data[ndx].name);
			}
			$('#msg').hide();
		});
	}
	
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