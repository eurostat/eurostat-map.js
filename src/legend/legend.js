import { select } from "d3-selection";
import { legendColor, legendSize } from "d3-svg-legend";
import { format } from "d3-format";


//TODO decompose file
//TODO build legends in a group, not a svg element ?
//TODO fix problem in legend position / dimension


/**
 * Create a map legend.
 * 
 * @param {*} map 
 */
export const legend = function(map) {
	const type = map.type();
	if (type == "ch")
		return legendChoropleth(map);
	else if (type == "ct")
		return legendCategorical(map);
	else if (type == "ps")
		return legendProportionnalSymbols(map);
	else
		console.log("Unknown map type: " + type)
	return out;
}



/**
 * A eurostat-map legend. This is an abstract method.
 * A legend is provided as an independant SVG image, which can be nested inside the map SVG.
*/
const _legend = function (map) {
	const out = {};

	out.map_ = map;

	out.svgId_ = "legend_" + Math.round(10e15*Math.random());
	out.svg_ = undefined;

	out.width_ = undefined;
	out.height_ = undefined;
	out.position_ = undefined;

	out.boxMargin_ = 10;
	out.boxPadding_ = 10;
	out.boxCornerRadius_ = out.boxPadding_;
	out.boxFill_ = "#EEEEEE";
	out.boxOpacity_ = 0.5;

	out.fontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleText_ = "Legend";
	out.titleFontSize_ = 20;
	out.titleWidth_ = 140;

	out.ascending_ = true;
	out.shapeWidth_ = 20;
	out.shapeHeight_ = 16;
	out.shapePadding_ = 2;
	out.labelFontSize_ = 15;
	out.labelDelimiter_ = " - ";
	out.labelWrap_ = 140;
	out.labelDecNb_ = 2;
	out.labelOffset_ = 5;

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
	out._lgg;



	/**
	 * Build legeng element.
	 */
	out.build = function () {

		//create svg
		out.svg( select("#" + out.svgId()) );
		out._lgg = out.svg().append("g");

		//set size
		if(!out.width_) out.width_ = out.computeWidth();
		if(!out.height_) out.height_ = out.computeHeight();
		out.svg().attr("width", out.width()).attr("height", out.height());

		//set position
		if(!out.position_) out.position_ = out.computePosition();
		out._lgg.attr("transform", "translate(" + out.position()[0] + "," + out.position()[1] + ")");
	}

	/**
	 * Update the legend element.
	 * This is an abstract method.
	 */
	out.update = function () {
		console.log("Legend update function not implemented")
		return out;
	};

	/**
	 * Return a default value for the legend width.
	 * This is an abstract method.
	 */
	out.computeWidth = function() {
		console.log("Legend computeWidth not implemented")
		return 100;
	}

	/**
	 * Return a default value for the legend height.
	 * This is an abstract method.
	 */
	out.computeHeight = function() {
		console.log("Legend computeHeight not implemented")
		return 100;
	}

	/**
	 * Return a default value for the legend position.
	 * This is an abstract method.
	 */
	out.computePosition = function() {
		console.log("Legend computePosition not implemented")
		return [0,0];
	}

	return out;
}




/**
 * A legend for choropleth maps
 * 
 * @param {*} map 
 */
const legendChoropleth = function (map) {
	const out = _legend(map);


	out.update = function() {
		const m = out.map();
		const svgMap = select("#" + m.svgId());

		//remove previous content
		out._lgg.selectAll("*").remove();

		//background rectangle
		out._lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
			.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
			.attr("width", out.width_).attr("height", out.height_)
			.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.titleText_)
			.titleWidth(out.titleWidth_)
			.useClass(true)
			.scale(m.classifier())
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
		out._lgg.call(d3Legend);

		//apply style to legend elements
		out._lgg.selectAll(".swatch")
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
		out._lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
		out._lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
		out._lgg.style("font-family", out.fontFamily_);
	}

	out.computeWidth = function() {
		return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.shapeWidth_ + out.labelOffset_ + out.labelWrap_);
	}
	out.computeHeight = function() {
		return out.boxPadding_ * 2 + out.titleFontSize_ + out.shapeHeight_ + (1 + out.shapeHeight_ + out.shapePadding_) * (out.map().clnb() - 1) + 12;
	}
	out.computePosition = function() {
		const x = out.boxPadding_;
		const y = out.boxPadding_ + out.titleFontSize_;
		return [x,y];
	}

	return out;
}



/**
 * A legend for categorical maps
 * 
 * @param {*} map 
 */
const legendCategorical = function (map) {
	const out = _legend(map);

	out.update = function() {
		const m = out.map();
		const cla = m.classifier();
		const claInv = m.classifierInverse();

		const svgMap = select("#" + m.svgId());

		//remove previous content
		out._lgg.selectAll("*").remove();

		//background rectangle
		out._lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
			.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
			.attr("width", out.width_).attr("height", out.height_)
			.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

		//define legend
		//see http://d3-legend.susielu.com/#color
		const d3Legend = legendColor()
			.title(out.titleText_)
			.titleWidth(out.titleWidth_)
			.useClass(true)
			.scale(cla)
			.ascending(out.ascending_)
			.shapeWidth(out.shapeWidth_)
			.shapeHeight(out.shapeHeight_)
			.shapePadding(out.shapePadding_)
			.labels( function (d) {
				return m.classToText() ? m.classToText()[claInv(d.i)] || claInv(d.i) : claInv(d.i);
			})
			.labelDelimiter(out.labelDelimiter_)
			.labelOffset(out.labelOffset_)
			.labelWrap(out.labelWrap_)
			.on("cellover", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", m.nutsrgSelectionFillStyle());
				sel.attr("fill___", function (d) { select(this).attr("fill"); });
			})
			.on("cellout", function (ecl) {
				ecl = cla(ecl);
				const sel = svgMap.select("#g_nutsrg").selectAll("[ecl='" + ecl + "']");
				sel.style("fill", function (d) { select(this).attr("fill___"); });
			});

		//make legend
		out._lgg.call(d3Legend);

		//apply style to legend elements
		out._lgg.selectAll(".swatch")
			.attr("ecl", function () {
				const ecl = select(this).attr("class").replace("swatch ", "");
				if (!ecl || ecl === "nd") return "nd";
				return ecl;
			})
			.attr("fill", function () {
				const ecl = select(this).attr("class").replace("swatch ", "");
				if (!ecl || ecl === "nd") return m.noDataFillStyle() || "gray";
				return m.classToFillStyleCT()[claInv(ecl)];
			});
		out._lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
		out._lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
		out._lgg.style("font-family", out.fontFamily_);
	}

	out.computeWidth = function() {
		return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.shapeWidth_ + out.labelOffset_ + out.labelWrap_);
	}
	out.computeHeight = function() {
		return out.boxPadding_ * 2 + out.titleFontSize_ + out.shapeHeight_ + (1 + out.shapeHeight_ + out.shapePadding_) * (out.map().clnb() - 1) + 12;
	}
	out.computePosition = function() {
		const x = out.boxPadding_;
		const y = out.boxPadding_ + out.titleFontSize_;
		return [x,y];
	}

	return out;
}


/**
 * A legend for proportionnal symbol map
 * 
 * @param {*} map 
 */
const legendProportionnalSymbols = function (map) {
	const out = _legend(map);

	//attributes
	out.cellNb_ = 4;
	out.cellNb = function (v) { if (!arguments.length) return out["cellNb_"]; out["cellNb_"] = v; return out.map(); }



	out.update = function() {
		const m = out.map();
		//const svgMap = select("#" + m.svgId());

		//remove previous content
		out._lgg.selectAll("*").remove();

		//background rectangle
		out._lgg.append("rect").attr("id", "legendBR").attr("x", -out.boxPadding_).attr("y", -out.titleFontSize_ - out.boxPadding_ + 6)
			.attr("rx", out.boxCornerRadius_).attr("ry", out.boxCornerRadius_)
			.attr("width", out.width_).attr("height", out.height_)
			.style("fill", out.boxFill_).style("opacity", out.boxOpacity_);

		//TODO better choose circle sizes. Rounded values.
		//define legend
		//see http://d3-legend.susielu.com/#size
		const d3Legend = legendSize()
			.title(out.titleText_)
			.titleWidth(out.titleWidth_)
			.scale(m.classifier())
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
		out._lgg.call(d3Legend);

		//apply style to legend elements
		out._lgg.selectAll(".swatch")
			.style("fill", m.psFill())
			.style("fill-opacity", m.psFillOpacity())
			.style("stroke", m.psStroke())
			.style("stroke-width", m.psStrokeWidth());

		out._lgg.select(".legendTitle").style("font-size", out.titleFontSize_);
		out._lgg.selectAll("text.label").style("font-size", out.labelFontSize_);
		out._lgg.style("font-family", out.fontFamily_);
	}

	out.computeWidth = function() {
		return out.boxPadding_ * 2 + Math.max(out.titleWidth_, out.psMaxSize_ + out.labelOffset_ + out.labelWrap_);
	}
	out.computeHeight = function() {
		return out.boxPadding_ * 2 + out.titleFontSize_ + (m.psMaxSize() * 0.7 + out.shapePadding_) * (out.cellNb_) + 35;
	}
	out.computePosition = function() {
		const x = out.boxPadding_;
		const y = out.boxPadding_ + out.titleFontSize_;
		return [x,y];
	}

	return out;
}

