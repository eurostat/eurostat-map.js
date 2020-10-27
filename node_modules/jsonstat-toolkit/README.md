# JSON-stat Javascript Toolkit

<blockquote>
This package (<strong>jsonstat-toolkit</strong>) contains version 1 of the JSON-stat Javascript Toolkit. Version 0 of this Toolkit can be found in the <a href="https://www.npmjs.com/package/jsonstat">jsonstat</a> package. If you need to support <em>very</em> old browsers (like IE6), stick to version 0. The two versions have identical APIs, except for the implementation of XHR (an optional feature, anyway) and version number exposition. Both changes affect only the JSONstat function: no method is affected. Version 0 is frozen.
</blockquote>

The [JSON-stat format](https://json-stat.org/format/) is a simple lightweight JSON format for data dissemination. It is based in a cube model that arises from the evidence that the most common form of data dissemination is the tabular form. In this cube model, **datasets** are organized in **dimensions**. Dimensions are organized in **categories**.

The JSON-stat Javascript Toolkit (JJT) is part of the [JSON-stat Toolkit](https://jsonstat.com). JJT's goal is to help dealing with JSON-stat responses in JavaScript.

### Resources

* [Installation](https://github.com/jsonstat/toolkit/blob/master/docs/INSTALL.md)
* [API Reference](https://github.com/jsonstat/toolkit/blob/master/docs/API.md)
* [Examples](https://github.com/jsonstat/toolkit/blob/master/docs/EXAMPLES.md)

## Design principles

JSON-stat is based on a data cube information structure. The JSON-stat Javascript Toolkit exposes the data cube as a tree.

### The JSON-stat tree

#### Datasets

Datasets are organized in dimensions and data.

 * *Dataset*
   * *Dimension*
     * *Category*
   * *Data*

#### Collections

Collections are sets of items. Items can be collections, datasets and dimensions (currently not supported by JJT).

 * *Collection*
   * *Item*

Generally, items in a collection contain just basic content and a pointer that allow a client to retrieve the full information about the item. But a collection can also contain the full information (embedded items).

#### Bundles (JSON-stat<2.0)

Bundles were packages of unordered arbitrary datasets.

* *Bundle*
   * *Dataset*
     * *Dimension*
       * *Category*
     * *Data*

Even though JSON-stat currently encourages the use of collections of embedded datasets instead of bundles, JJT supports both approaches.

To retrieve information about the first category of the first dimension of the first embedded dataset in a JSON-stat collection (or bundle) *j*, the JSON-stat Javascript Toolkit allows you to traverse the JSON-stat tree like this:

```js
JSONstat( j ).Dataset( 0 ).Dimension( 0 ).Category( 0 )
```

The class of the response can be checked using the *class* property:

```js
if(JSONstat( j ).class==="dataset"){
   var cat0=JSONstat( j ).Dimension( 0 ).Category( 0 );   
}
```

### General properties

 * *label*: label of the selected element (string)
 * *length*: number of children of the selected element (number).
 * *id*: IDs of the children of the selected element (array).

### Reading and traversing methods

These methods (except JSONstat, which is not actually a method) accept a selection argument. If it is not provided, an array is returned with the information for every child of the selected element.

#### JSONstat

It reads a JSON-stat response and returns an object.

```js
JSONstat( { ... } ).length
//number of datasets in the object

JSONstat( "https://json-stat.org/samples/oecd-canada-col.json" ).then(
  function(J){
     console.log( J.length );
  }
)
//number of items in oecd-canada-col.json.
```

#### Dataset

It selects an embedded dataset in the JSON-stat collection (or bundle).

```js
JSONstat( j ).Dataset( 0 ).id //IDs of the dimensions in the first dataset
```

#### Dimension

It selects a particular dimension in a dataset.

```js
JSONstat( j ).Dataset( 0 ).Dimension( "time" ).label
//Label of the "time" dimension in the first dataset

JSONstat( j ).Dataset( 0 ).Dimension( "country" ).role
//Role of the "country" dimension in the first dataset
```

#### Category

It selects a particular category in a dimension in a dataset.

```js
JSONstat( j ).Dataset( 0 ).Dimension( "time" ).Category( 0 ).label
//Label of the first category of the "time" dimension in the first dataset
```

#### Data

When an argument is passed, selects a single cell of the data cube in the JSON-stat response. If no argument is passed, returns all the cells.

The resulting object contains the property "value" (value of a cell) and "status" (its status).

```js
JSONstat( j ).Dataset( 0 ).Data( 0 ).value
//Value of the first cell (usually a number, but values can be of any type).

JSONstat( j ).Dataset( 0 ).Data( [ 0, 0, 0 ] ).value
//Value of the first cell in a dataset with 3 dimensions (usually a number).

JSONstat( j ).Dataset( 0 ).Data( { "metric" : "UNR", "geo" : "GR", "time" : "2014" } ).value
//Unemployment rate in Greece in 2014 (usually a number).

JSONstat( j ).Dataset( 0 ).Data( { "metric" : "UNR", "geo" : "GR", "time" : "2014" } ).status
//Status of unemployment rate in Greece in 2014.
```

When the argument is neither an integer nor an array, single category dimensions (&ldquo;constant dimensions&rdquo;) can be skipped. If one and only one non-constant dimension is not specified, the result will be an array with as many elements as categories in the unspecified dimension.

### Transformation methods

Transformation methods get information in the JSON-stat tree and export it to a different JSON structure for convenience.

#### toTable

This is a dataset method. It converts the information of a particular dataset into a JSON table. The conversion can be setup using an optional argument.

```js
JSONstat( j ).Dataset( 0 ).toTable()
//Returns an array of arrays that exposes a tabular structure (rows and columns).
//Useful in many situations. For example, it can be a Google Visualization API input.

JSONstat( j ).Dataset( 0 ).toTable( { field : "id" } )
//Uses ids instead of labels as column names.

JSONstat( j ).Dataset( 0 ).toTable( { vlabel : "Valor", type : "object" } )
//Returns an object of arrays (of objects) that exposes a tabular structure (rows and columns)
//in the Google DataTable format (it's the native input format of Google
//Visualization API input). The "vlabel" property is instructing the method to use
//"Valor" as the label of the values column (instead of "Value").

JSONstat( j ).Dataset( 0 ).toTable( { status : true, slabel : "Metadata" } )
//The table will include a status column with label "Metadata".

JSONstat( j ).Dataset( 0 ).toTable( { type : "arrobj" } )
//Returns an array of objects where each dimension id is a property, plus a "value" property.

JSONstat( j ).Dataset( 0 ).toTable( { type: "arrobj", content: "id" } )
//same but category ids ("AU") are used instead of labels ("Australia") even for content.

JSONstat( j ).Dataset( 1 ).toTable(
   { type : "arrobj", content : "id" },
   function( d, i ){
      if ( d.sex === "F" && d.concept === "POP" ){
         return { age : d.age, population : d.value*1000 };
      }
   }
)
//Get only the female population by age of Canada
//and convert values from thousands to persons.
```
