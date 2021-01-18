import { select } from "d3-selection";
import { format } from "d3-format";
import * as lg from '../core/legend';

/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map);

	//the width of the legend box elements
	out.shapeWidth = 13;
	//the height of the legend box elements
	out.shapeHeight = 15;
	//the distance between consecutive legend box elements
	out.shapePadding = 5;
	//the font size of the legend label
	out.labelFontSize = 12;
	//the distance between the legend box elements to the corresponding text label
	out.labelOffset = 5;
	//show no data
	out.noData = true;
	//no data label text
	out.noDataText = "No data";


	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];


	//@override
	out.update = function () {
		const m = out.map;
		const svgMap = m.svg();
		const lgg = out.lgg;

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend background box
		out.makeBackgroundBox();

		//draw title
		if(out.title)
			lgg.append("text").attr("x", out.boxPadding).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.title)
			.style("font-size", out.titleFontSize).style("font-weight", out.titleFontWeight)
			.style("font-family", out.fontFamily).style("fill", out.fontFill)

		//set font family
		lgg.style("font-family", out.fontFamily);


        //draw legend elements for classes: rectangle + label
        let i=0;
        const scs = m.catColors();
		for(let code in scs) {

			//the vertical position of the legend element
			const y = out.boxPadding + (out.title? out.titleFontSize + out.boxPadding : 0) + i*(out.shapeHeight + out.shapePadding);

			//rectangle
			lgg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.shapeWidth).attr("height", out.shapeHeight)
			.attr("fill", scs[code])
			.attr("stroke", "black").attr("stroke-width", 0.5)
			.on("mouseover", function () {
				svgMap.selectAll("pattern").selectAll("rect[code='"+code+"']")
					.style("fill", m.nutsrgSelFillSty())
			})
			.on("mouseout", function () {
				const col = m.catColors()[code] || "lightgray";
				svgMap.selectAll("pattern").selectAll("rect[code='"+code+"']")
					.style("fill", col)
			})

			//label
			lgg.append("text").attr("x", out.boxPadding+out.shapeWidth+out.labelOffset).attr("y", y+out.shapeHeight*0.5)
			.attr("alignment-baseline", "middle")
			.text( m.catLabels()[code] || code )
			.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
			.on("mouseover", function () {
				svgMap.selectAll("pattern").selectAll("rect[code='"+code+"']")
					.style("fill", m.nutsrgSelFillSty())
			})
			.on("mouseout", function () {
				const col = m.catColors()[code] || "lightgray";
				svgMap.selectAll("pattern").selectAll("rect[code='"+code+"']")
					.style("fill", col)
			})

            i++;
        }

		//'no data' legend box
		if(out.noData) {
			const y = out.boxPadding + (out.title? out.titleFontSize + out.boxPadding : 0) + i*(out.shapeHeight + out.shapePadding);

			//rectangle
			lgg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.shapeWidth).attr("height", out.shapeHeight)
			.attr("fill", m.noDataFillStyle() )
			.attr("stroke", "black").attr("stroke-width", 0.5)
			.on("mouseover", function () {
				//TODO
				/*const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='nd']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
				select(this).style("fill", m.nutsrgSelFillSty());*/
			})
			.on("mouseout", function () {
                //TODO
				/*const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='nd']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
				select(this).style("fill", m.noDataFillStyle());*/
			});

			//'no data' label
			lgg.append("text").attr("x", out.boxPadding+out.shapeWidth+out.labelOffset).attr("y", y+out.shapeHeight*0.5)
			.attr("alignment-baseline", "middle")
			.text(out.noDataText)
			.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	return out;
}
