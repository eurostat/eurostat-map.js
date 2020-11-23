import { select } from "d3-selection";
import { legendColor, legendSize } from "d3-svg-legend";
import { format } from "d3-format";


/**
 * A eurostat-map legend.
 * It is provided as an independant SVG image, which can be nested inside the map SVG.
*/
export const legend = function (map) {
	const out = {};

	out.map_ = map;

	out.svgId_ = "legend_" + Math.round(10e15*Math.random());
	out.svg_ = undefined; //TODO remove? or add the same to map?
	out.width_ = undefined;
	out.height_ = undefined;
	out.position_ = undefined;
	out.fontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleText_ = "Legend";
	out.titleFontSize_ = 20;
	out.titleWidth_ = 140;
	out.boxMargin_ = 10;
	out.boxPadding_ = 10;
	out.boxCornerRadius_ = out.boxPadding_;
	out.boxFill_ = "#EEEEEE";
	out.boxOpacity_ = 0.5;
	out.ascending_ = true;
	out.shapeWidth_ = 20;
	out.shapeHeight_ = 16;
	out.shapePadding_ = 2;
	out.labelFontSize_ = 15;
	out.labelDelimiter_ = " - ";
	out.labelWrap_ = 140;
	out.labelDecNb_ = 2;
	out.labelOffset_ = 5;

	out.cellNb_ = 4; // for ps maps only

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (let att in out)
		(function () {
			const att_ = att;
			out[att_.substring(0, att_.length - 1)] = function (v) { if (!arguments.length) return out[att_]; out[att_] = v; return out.map(); };
		})();

	/**
	 * Private variables.
	 */

	//the group where to draw the legend
	let lgg;

	/**
	 * Build legeng element.
	 */
	out.build = function () {

		//create svg
		out.svg( select("#" + out.svgId()) );
		lgg = out.svg().append("g");

		//set size
		if(!out.width_) out.width_ = out.computeWidth();
		if(!out.height_) out.height_ = out.computeHeight();
		out.svg().attr("width", out.width()).attr("height", out.height());

		//set position
		if(!out.position_) out.position_ = out.computePosition();
		lgg.attr("transform", "translate(" + out.position()[0] + "," + out.position()[1] + ")");
	}




	out.computeWidth = function() {
		const type = out.map().type();
		if (type == "ps") return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.psMaxSize_ + out.labelOffset_ + out.labelWrap_);
		else return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.shapeWidth_ + out.labelOffset_ + out.labelWrap_);
	}
	out.computeHeight = function() {
		const type = out.map().type();
		if (type == "ps") return out.boxPadding_ * 2 + out.titleFontSize_ + (m.psMaxSize() * 0.7 + out.shapePadding_) * (out.cellNb_) + 35;
		else return out.boxPadding_ * 2 + out.titleFontSize_ + out.shapeHeight_ + (1 + out.shapeHeight_ + out.shapePadding_) * (out.map().clnb() - 1) + 12;
	}
	out.computePosition = function() {
		const x = out.boxPadding_;
		const y = out.boxPadding_ + out.titleFontSize_;
		return [x,y];
	}

	/**
	 * Update the legend element.
	 */
	out.update = function () {
		const type = out.map().type();
		if (type == "ch")
			updateLegendCH();
		else if (type == "ct")
			updateLegendCT();
		else if (type == "ps")
			updateLegendPS();
		else
			console.log("Unknown map type: " + type)

		return out;
	};



	const cla = ()=>{ return out.map().classifier() };
	const claInv = ()=>{ return out.map().classifierInverse() };


	const updateLegendCH = function() {
			const m = out.map();
			const svgMap = select("#" + m.svgId());

			//remove previous content
			lgg.selectAll("*").remove();

			//background rectangle
			lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
				.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
				.attr("width", out.width_).attr("height", out.height_)
				.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

			//define legend
			//see http://d3-legend.susielu.com/#color
			const d3Legend = legendColor()
				.title(out.titleText_)
				.titleWidth(out.titleWidth_)
				.useClass(true)
				.scale(cla())
				.ascending(out.ascending_)
				.shapeWidth(out.shapeWidth_)
				.shapeHeight(out.shapeHeight_)
				.shapePadding(out.shapePadding_)
				.labelFormat(format(".0" + out.labelDecNb_ + "f"))
				//.labels(d3.legendHelpers.thresholdLabels)
				.labels( function (d) {
						if (d.i === 0)
							return "< " + d.generatedLabels[d.i].split(d.labelDelimiter)[1];
						else if (d.i === d.genLength - 1)
							return ">= " + d.generatedLabels[d.i].split(d.labelDelimiter)[0];
						else
							return d.generatedLabels[d.i]
						})
				.labelDelimiter(out.labelDelimiter_)
				.labelOffset(out.labelOffset_)
				.labelWrap(out.labelWrap_)
				//.labelAlign("end") //?
				//.classPrefix("from ")
				//.orient("vertical")
				//.shape("rect")
				.on("cellover", function (ecl) {
					const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
					sel.style("fill", m.nutsrgSelectionFillStyle());
					sel.attr("fill___", function (d) { select(this).attr("fill"); });
				})
				.on("cellout", function (ecl) {
					const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
					sel.style("fill", function (d) { select(this).attr("fill___"); });
				});

			//make legend
			lgg.call(d3Legend);

			//apply style to legend elements
			lgg.selectAll(".swatch")
				.attr("ecl", function () {
					const ecl = select(this).attr("class").replace("swatch ", "");
					if (!ecl || ecl === "nd") return "nd";
					return ecl;
				})
				.attr("fill", function () {
					const ecl = select(this).attr("class").replace("swatch ", "");
					if (!ecl || ecl === "nd") return m.noDataFillStyle() || "gray";
					return m.classToFillStyleCH()(ecl, m.clnb());
				})
				//.attr("stroke", "black")
				//.attr("stroke-width", 0.5)
				;
			lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
			lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
			lgg.style("font-family", out.fontFamily_);
	}




	const updateLegendCT = function() {
			const m = out.map();
			const svgMap = select("#" + m.svgId());

			//remove previous content
			lgg.selectAll("*").remove();

			//background rectangle
			lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
				.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
				.attr("width", out.width_).attr("height", out.height_)
				.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

			//define legend
			//see http://d3-legend.susielu.com/#color
			const d3Legend = legendColor()
				.title(out.titleText_)
				.titleWidth(out.titleWidth_)
				.useClass(true)
				.scale(cla())
				.ascending(out.ascending_)
				.shapeWidth(out.shapeWidth_)
				.shapeHeight(out.shapeHeight_)
				.shapePadding(out.shapePadding_)
				.labels( function (d) {
					return m.classToText() ? m.classToText()[claInv()(d.i)] || claInv()(d.i) : claInv()(d.i);
				})
				.labelDelimiter(out.labelDelimiter_)
				.labelOffset(out.labelOffset_)
				.labelWrap(out.labelWrap_)
				.on("cellover", function (ecl) {
					ecl = cla()(ecl);
					const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
					sel.style("fill", m.nutsrgSelectionFillStyle());
					sel.attr("fill___", function (d) { select(this).attr("fill"); });
				})
				.on("cellout", function (ecl) {
					ecl = cla()(ecl);
					const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
					sel.style("fill", function (d) { select(this).attr("fill___"); });
				});

			//make legend
			lgg.call(d3Legend);

			//apply style to legend elements
			lgg.selectAll(".swatch")
				.attr("ecl", function () {
					const ecl = select(this).attr("class").replace("swatch ", "");
					if (!ecl || ecl === "nd") return "nd";
					return ecl;
				})
				.attr("fill", function () {
					const ecl = select(this).attr("class").replace("swatch ", "");
					if (!ecl || ecl === "nd") return m.noDataFillStyle() || "gray";
					return m.classToFillStyleCT()[claInv()(ecl)];
				});
			lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
			lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
			lgg.style("font-family", out.fontFamily_);
	}




	const updateLegendPS = function() {
			const m = out.map();
			//const svgMap = select("#" + m.svgId());

			//remove previous content
			lgg.selectAll("*").remove();

			//background rectangle
			lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
				.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
				.attr("width", out.width_).attr("height", out.height_)
				.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

			//define legend
			//see http://d3-legend.susielu.com/#size
			const d3Legend = legendSize()
				.title(out.titleText_)
				.titleWidth(out.titleWidth_)
				.scale(cla())
				.cells(out.cellNb_ + 1)
				.cellFilter(function (d) { if (!d.data) return false; return true; })
				.orient("vertical")
				.ascending(out.ascending_)
				.shape("circle") //"rect", "circle", or "line"
				.shapePadding(out.shapePadding_)
				//.classPrefix("prefix")
				.labels(function (d) { return d.generatedLabels[d.i] })
				//.labelAlign("middle") //?
				.labelFormat(format("." + out.labelDecNb_ + "f"))
				.labelOffset(out.labelOffset_)
				.labelWrap(out.labelWrap_)
				;

			//make legend
			lgg.call(d3Legend);

			//apply style to legend elements
			lgg.selectAll(".swatch")
				.style("fill", m.psFill())
				.style("fill-opacity", m.psFillOpacity())
				.style("stroke", m.psStroke())
				.style("stroke-width", m.psStrokeWidth());

			lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
			lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
			lgg.style("font-family", out.fontFamily_);
	}

	return out;
}


export const createLegend = function(map) {
	const type = map.type();
	if (type == "ch")
		return legend_ch(map);
	else if (type == "ct")
		return legend_ct(map);
	else if (type == "ps")
		return legend_ps(map);
	else
		console.log("Unknown map type: " + type)
	return out;
}

export const legend_ch = function (map) {
	const out = legend(map);
	return out;
}

export const legend_ct = function (map) {
	const out = legend(map);
	return out;
}

export const legend_ps = function (map) {
	const out = legend(map);
	return out;
}

