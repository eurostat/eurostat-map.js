import { select } from "d3-selection";
import * as lg from '../core/legend';

/**
 * A legend for choropleth-bivariate maps
 * 
 * @param {*} map 
 */
export const legend = function (map, config) {

	//build generic legend object for the map
	const out = lg.legend(map, config);

	//size
	out.squareSize = 50;
	//the order of the legend elements. Set to false to invert.
	out.ascending1 = true;
	out.ascending2 = true;
	
	//labels
	out.label1 = "Variable 1";
	out.label2 = "Variable 2";
	//the font size of the legend label
	out.labelFontSize = 12;

	//show no data
	out.noData = true;
	//show no data
	out.noDataShapeSize = 15;
	//no data text label
	out.noDataText = "No data";

	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];


	//@override
	out.update = function () {
		const m = out.map;
		const svgMap = m.svg();
		const lgg = out.lgg;
		const clnb = m.clnb();
		const sz = out.squareSize / clnb;
		const xc = 0.7071*out.squareSize + out.boxPadding;

		//remove previous content
		lgg.selectAll("*").remove();

		//draw legend background box
		out.makeBackgroundBox();

		//draw title
		if(out.title)
			lgg.append("text").attr("x", xc).attr("y", out.boxPadding + out.titleFontSize)
			.text(out.title)
			.style("text-anchor", "middle")
			.style("font-size", out.titleFontSize).style("font-weight", out.titleFontWeight)
			.style("font-family", out.fontFamily).style("fill", out.fontFill)

		//set font family
		lgg.style("font-family", out.fontFamily);

		//the vertical position of the legend element
		let y = out.boxPadding + (out.title? out.titleFontSize + out.boxPadding : 0);

		//square group
		const square = lgg.append("g")
		.attr("transform", "translate("+(out.boxPadding)+","+(xc+y)+") rotate(-45) translate("+(out.boxPadding)+","+0+")")

		for(let i=0; i<clnb; i++)
			for(let j=0; j<clnb; j++) {

				//the class numbers, depending on order
				const ecl1 = out.ascending1? clnb-i-1 : i;
				const ecl2 = out.ascending2? clnb-j-1 : j;
				const fill = m.classToFillStyle()(ecl1,ecl2);

				//draw rectangle
				square.append("rect").attr("x", (clnb-1-i)*sz).attr("y", j*sz)
				.attr("width", sz).attr("height", sz)
				.attr("fill", fill)
				.on("mouseover", function () {
					const sel = svgMap.select("#g_nutsrg").selectAll("[ecl1='" + ecl1 + "']").filter("[ecl2='" + ecl2 + "']");
					sel.style("fill", m.nutsrgSelFillSty());
					sel.attr("fill___", function () { select(this).attr("fill"); });
					select(this).style("fill", m.nutsrgSelFillSty());
				})
				.on("mouseout", function () {
					const sel = svgMap.select("#g_nutsrg").selectAll("[ecl1='" + ecl1 + "']").filter("[ecl2='" + ecl2 + "']");
					sel.style("fill", function () { select(this).attr("fill___"); });
					select(this).style("fill", fill);
				})
			}

		//labels
		square.append("text").attr("x", 0).attr("y", out.squareSize + out.labelFontSize)
		.text(out.label1)
		.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)

		square.append("text").attr("x", -out.labelFontSize).attr("y", out.labelFontSize)
		.text(out.label2)
		.attr("transform", "rotate(90) translate("+out.labelFontSize+",0)")
		.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		//https://stackoverflow.com/questions/16726115/svg-text-rotation-around-the-center/30022443


		//frame
		square.append("rect").attr("x", 0).attr("y", 0)
		.attr("width", out.squareSize).attr("height", out.squareSize)
		.attr("fill", "none").style("stroke", "black").attr("stroke-width", 0.7)


		//'no data' legend box
		if(out.noData) {
			y = y + 1.4142*out.squareSize + out.boxPadding*2 + out.labelFontSize;

			//rectangle
			lgg.append("rect").attr("x", out.boxPadding).attr("y", y)
			.attr("width", out.noDataShapeSize).attr("height", out.noDataShapeSize)
			.attr("fill", m.noDataFillStyle() )
			.attr("stroke", "black").attr("stroke-width", 0.7)
			.on("mouseover", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[nd='nd']");
				sel.style("fill", m.nutsrgSelFillSty());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
				select(this).style("fill", m.nutsrgSelFillSty());
			})
			.on("mouseout", function () {
				const sel = svgMap.select("#g_nutsrg").selectAll("[nd='nd']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
				select(this).style("fill", m.noDataFillStyle());
			});
			//'no data' label
			lgg.append("text").attr("x", out.boxPadding+out.noDataShapeSize+out.boxPadding).attr("y", y+out.noDataShapeSize*0.5)
			.attr("alignment-baseline", "middle")
			.text(out.noDataText)
			.style("font-size", out.labelFontSize).style("font-family", out.fontFamily).style("fill", out.fontFill)
		}

		//set legend box dimensions
		out.setBoxDimension();
	}

	return out;
}
