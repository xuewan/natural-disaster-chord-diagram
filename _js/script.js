$(document).ready(function(){
// Setup viz canvas
	var w = 800;
	var h = 500;
	var padding = 50;
	var viz = d3.select("#viz")
				.attr("width", w)
				.attr("height", h)
				.append("g")
				.attr("transform", "translate(" + w/2 + ","+(h/2)+")");


//read matrix data
	var matrix = [];
	var groupname = [];
	var colors = [];
	d3.csv("_data/matrix.csv", function(disasterCounts){
		d3.csv("_data/groups.csv", function(groupNames){

			disasterCounts.forEach(function(d){
				//console.log("d is ", d);
				var row = [];
				for (var key in d){
					row.push(+d[key])
				}
				//console.log("row is ", row);
				matrix.push(row);
			});

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

			var g = viz.selectAll("g")
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
			viz.append("g")
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
			    viz.selectAll(".chord path")
			       .filter(function(d) { return d.source.index != i && d.target.index != i; })
			      .transition()
			      .style("opacity", opacity);
			  };
			}

			function fadeSelectedProv(id, opacity){
				if(id != 99){
					viz.selectAll(".chord path")
			  			.filter(function(d){return d.source.index != id && d.target.index !=id; })
			  			.transition()
			  			.style("opacity", opacity);
		  		}
		  		else{
		  			viz.selectAll(".chord path")
			  			.transition()
			  			.style("opacity", 1);
		  		}
			}

			$(".filter").on("click", function() {
		  		$(".filter").removeClass("selected");
		 		fadeSelectedProv(99, 1);
		  		$(this).addClass("selected");
		  		
		  		var provid = $(this).attr("id");
		  		var id = provid.substring(provid.indexOf("-")+1);
		  		//console.log("extract id: ", id);

		  		fadeSelectedProv(id,0.05);

		  	}); 


		}); //end d3.csv groups.csv
	}); //end d3.csv disasterCounts.csv
}); //$(docutment).ready