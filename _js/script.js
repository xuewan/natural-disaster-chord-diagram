$(document).ready(function(){
// Setup viz canvas for chord diagram
	var w = 1000;
	var h = 500;
	var padding = 50;
	var viz = d3.select("#viz")
				.attr("width", w)
				.attr("height", h);
	var chordChart = viz.append("g")
					.attr("transform", "translate(" + (w/4+padding) + ","+(h/2)+")");

	var barChart = viz.append("g");

//read matrix data
	var matrix = [];
	var groupname = [];
	var colors = [];
	d3.csv("_data/matrix.csv", function(disasterCounts){
	d3.csv("_data/groups.csv", function(groupNames){
	d3.csv("_data/disaster.csv", function(disasters){

	//process data for bar chart
	var allDisasters = d3.nest()
				.key(function(d){
					return d.EVENT_TYPE;
				})
				.rollup(function(d){
					return d.length;
				})
				.entries(disasters);

	var disasterByProv = d3.nest()
				.key(function(d){
					return d.EVENT_TYPE;
				})
				.key(function(d){
					return d.PROVINCE;
				})
				.rollup(function(d){
					return d.length;
				})
				.entries(disasters);

		disasterCounts.forEach(function(d){
			//console.log("d is ", d);
			var row = [];
			for (var key in d){
				row.push(+d[key])
			}
			// console.log("row is ", row);
			matrix.push(row);
		});

	//get chord diagram group names
		groupNames.forEach(function(d){
			groupname.push(d.group);
			colors.push(d.color);
		});
		
		var chord = d3.layout.chord()
					.padding(0.05)
					.sortSubgroups(d3.descending)
					.sortChords(d3.descending)
					.matrix(matrix);

		var outerRadius = Math.min(w,h)/2 - 80;
		var innerRadius = outerRadius - 24;

		var fill = d3.scale.ordinal()
			       .domain(d3.range(colors.length))
			       .range(colors);

		var g = chordChart.selectAll("g")
					.data(chord.groups)
					.enter()
					.append("g")
					.attr("class", "group")
					.on("mouseover", fade(0.05))
					.on("mouseout",fade(1));

		//draw the chord groups
		g.append("path")
			.style("fill", function(d){
				return fill(d.index);
			})
			.style("stroke", function(d){
				return d3.rgb(fill(d.index)).darker(1);
			})
			.attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius));
		
		//draw chord group labels
		g.append("text")
			.each(function(d){
				d.angle = (d.startAngle + d.endAngle)/2;
			})
			.attr("dy", ".35em")
			.attr("text-anchor", function(d){
				return d.angle > Math.PI? "end" : null;
			})
			.attr("transform", function(d){
				return "rotate(" + (d.angle*180/Math.PI - 90) + ")" 
						+ "translate(" + (outerRadius+5) + ")"
						+ (d.angle > Math.PI ? "rotate(180)" : "");
			})
			.text(function(d){
				return groupname[d.index];
			});

		//draw the chords
		chordChart.append("g")
			.attr("class", "chord")
			.selectAll("path")
			.data(chord.chords)
			.enter()
			.append("path")
			.attr("d", d3.svg.chord().radius(innerRadius))
			.style("fill", function(d){
				return fill(d.target.index);
			})
			.style("stroke", function(d){
				return d3.rgb(fill(d.target.index)).darker(0.5);
			})
			.style("opacity", 1);

		//fade out unselecte groups
		function fade(opacity) {
		  return function(g, i) {
		    chordChart.selectAll(".chord path")
		       .filter(function(d) { return d.source.index != i && d.target.index != i; })
		      .transition()
		      .style("opacity", opacity);
		  };
		}

		//fade out when click on filter links
		function fadeSelectedProv(id, opacity){
			if(id != 99){
				chordChart.selectAll(".chord path")
		  			.filter(function(d){return d.source.index != id && d.target.index !=id; })
		  			.transition()
		  			.style("opacity", opacity);
	  		}
	  		else{
	  			chordChart.selectAll(".chord path")
		  			.transition()
		  			.style("opacity", 1);
	  		}
		}

		//event listener for clicking on filter links
		$(".filter").on("click", function() {
	  		$(".filter").removeClass("selected");
	 		fadeSelectedProv(99, 1);
	  		$(this).addClass("selected");
	  		
	  		var provId = $(this).attr("id");
	  		var name = $(this).html();
	  		var id = provId.substring(provId.indexOf("-")+1);
	  		//console.log("extract id: ", id);

	  		fadeSelectedProv(id,0.05);
	  		if(id != 99){
	  			//draw bar chart

				updateBarChart(name);
	  		}
	  	});

	//DRAW THE BART CHART
		//setup scales
		var xScale = d3.scale.ordinal()
						.domain(allDisasters.map(function(d){
							return d.key;
						}))
   				 .rangeRoundBands([w/2+padding, w], .1);
   		
   		var maxNumDisaster = findMaxNumDisaster(allDisasters);
   		console.log(maxNumDisaster);

		yScale = d3.scale.linear()
  			.domain([0,maxNumDisaster])
  			.range([0, (h-2*padding)]);

  		yAxisScale = d3.scale.linear()
  						.domain([0,maxNumDisaster])
  						.range([(h-2*padding),0]);
  		
		//draw axises and lables
		var xAxis = d3.svg.axis()
    				.scale(xScale)
    				.orient("bottom");

    	var yAxis = d3.svg.axis()
   					.scale(yAxisScale)
    				.orient("left");
  		//draw bars
		var bar = barChart.selectAll("g")
						.data(allDisasters)
						.enter()
						.append("g")
						.attr("transform", function(d){
							return "translate(" + xScale(d.key) + ",0)"; 
						});
		bar.append("rect")
			.attr("y", function(d){
				return yAxisScale(d.values);
			})
			.attr("height", function(d){
				return yScale(d.values);
			})
			.attr("width",xScale.rangeBand())
			.style("fill", "#4682B4");

    	//draw X-Axis
    	barChart.append("g")
			    .attr("class", "x-axis")
			    .attr("transform", "translate(0," + (h-2*padding) + ")")
			    .call(xAxis)
			    .selectAll("text")
				.attr("dx", "-.8em")
				.attr("dy",".15em")
				.style("text-anchor", "end")
				.attr("class", "barChart-label")
				.attr("transform", "rotate(-45)");

		//draw Y-Axis
		barChart.append("g")
				.attr("class", "y-axis")
				.attr("transform", "translate("+(w/2+padding) + ",0)")
				.call(yAxis);

		var legend = barChart
					.append("g")
					.attr("class", "barChart-title")
					.attr("transform", "translate(" + (w/4*3+2*padding) + "," + padding + ")")
					.append("text")
					.text("All Provinces");

	//create an update function to change bar chart when clicking on filter link
	function updateBarChart(provname){
		var newData =[];
		disasterByProv.forEach(function(d){
			// console.log("for each event type in disasterByProv:", d.key);
			var event_type = d.key;
			var provData = d.values;
			var value = 0;
			for (var i=0; i<provData.length; i++){
				// console.log("provData is: ", provData);
				if(provname == provData[i].key){
					value = provData[i].values;
				}
			}
			newData.push({"key": event_type, "values": value});
		});
		
		//rescale the y axis if necessary
		newMax = findMaxNumDisaster(newData);
		if (newMax <5){
			newMax = 5;
		}
		// console.log("newMax is ", newMax);
		yScale.domain([0,newMax]);
		yAxisScale.domain([0, newMax]);

		//redraw bars
		barChart.selectAll("rect")
				.data(newData)
				.transition().duration(1500)
				.attr("y", function(d){
					console.log(d.values);
					return yAxisScale(d.values);
				})
				.attr("height", function(d){
					return yScale(d.values);
				})
				.attr("width",xScale.rangeBand()-15)
				.style("fill", "#4682B4");

   		//redraw y-axis
   		barChart.select(".y-axis")
				.call(yAxis)
				.transition().duration(1500);

   		legend.text("Province: " + provname);
	}//end updateBarChart function

});//end d3.csv disaster.csv
}); //end d3.csv groups.csv
}); //end d3.csv disasterCounts.csv i.e the matrix
}); //$(docutment).ready

//helper function
function findMaxNumDisaster(data){
	var max = 0;
	for (var i=0; i<data.length; i++){
		// console.log(data[i]);
		if (max < data[i].values){
			max = data[i].values;
		}
	}
	return max;
}