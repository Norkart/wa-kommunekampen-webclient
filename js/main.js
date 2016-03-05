var Norkart = Norkart || {};

(function(ns) {
  ns.main = function() {


    var spinner = new Spinner({
      lines: 9,
      length: 56,
      width: 8,
      radius: 84,
      scale: 1,
      corners: 1,
      color: '#000',
      opacity: 0.25,
      rotate: 0,
      direction: 1,
      speed: 0.9,
      trail: 40,
      fps: 20,
      zIndex: 2e9,
      className: 'spinner',
      top: '50%',
      left: '50%',
      shadow: false,
      hwaccel: false,
      position: 'absolute'
    }).spin($("#spinner")[0]);

    window.map = new L.Map('map', {
      center: [63.78673256008556, 11.472129821777344],
      zoom: 5,
      scrollWheelZoom: false
    });

    var layercontrol = L.control.layers().addTo(map);

    var stamentoner = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
      attribution: 'Stamen'
    }).addTo(map).setOpacity(1);

    layercontrol.addBaseLayer(stamentoner, "Svart/Hvitt");

    var layer_definition = {
      user_name: "atlefren",
      layers: [{
        type: "cartodb",
        options: {
          sql: "SELECT * FROM kommuner where komm='1719'",
          cartocss: "#kommuner{line-color: #000000;line-width: 5;line-opacity: 1;}"
        }
      }]
    };


    window.redCornerKomm = 0;
    window.blueCornerKomm = 0;
    var clickCount = 0;
    var vizurl = 'https://alexanno-test.cartodb.com/api/v2/viz/0795e4a6-e30d-11e5-8842-0e787de82d45/viz.json';
    var cdblayer = cartodb.createLayer(map, vizurl)
      .addTo(map)
      .on('done', function(layer) {

        layercontrol.addOverlay(layer, "Faresoner");

        layer.setInteraction(true);
        layer.setInteractivity(['komm2', 'navn2']);

        var highlightlayer = layer.createSubLayer({
          sql: "SELECT * FROM kommuner WHERE komm='0'",
          cartocss: "#layer { line-color: #000; line-width: 5; }"
        });

        layer.on('featureClick', function(e, latlng, pos, data) {
          clickCount++;

          if (clickCount % 2) {
            window.redCornerKomm = data.komm2;
            $("#redcornerinfo").html([
              '<h2>', data.navn2, '</h2>',
              '<h4>', data.komm2, '</h4>'
            ].join(''));
          } else {
            $("#runAnalysis").prop("disabled", false);
            window.blueCornerKomm = data.komm2;
            $("#bluecornerinfo").html([
              '<h2>', data.navn2, '</h2>',
              '<h4>', data.komm2, '</h4>'
            ].join(''));
          }
          console.log("klikket på: ", data, redCornerKomm, blueCornerKomm);

          highlightlayer.setSQL("SELECT *, coalesce(navn, admenhetnavn_1__navn) navn2 FROM kommuner WHERE komm IN ('" + redCornerKomm + "','" + blueCornerKomm + "')");
          highlightlayer.setCartoCSS("#layer[komm=" + redCornerKomm + "] { line-color: #f00; line-width: 5; } #layer[komm=" + blueCornerKomm + "] { line-color: #00f; line-width: 5; } #layer::labels {text-name: [navn2];text-face-name: 'DejaVu Sans Book';text-size: 15;text-label-position-tolerance: 0;text-fill: #000;text-halo-fill: #FFF;text-halo-radius: 2;text-allow-overlap: true;text-placement: point;text-placement-type: dummy;}");
        });

        layer.on('error', function(err) {
          cartodb.log.log('error: ' + err);
        });
      }).on('error', function() {
        cartodb.log.log("some error occurred");
      });

    //open a "pdf blob" as a proper pdf file
    //see http://stackoverflow.com/a/20194533/1328635
    function openPdf(data, filename) {
      var a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([data], {
        type: 'application/pdf'
      }));
      a.download = filename || 'file.pdf';
      // Append anchor to body.
      document.body.appendChild(a)
      a.click();
      // Remove anchor from body
      document.body.removeChild(a)
    }

    //calls analyseplatform, returns a blob
    //seems like jQuery cannot return a blob, see 
    //http://stackoverflow.com/questions/15467747/properly-create-and-serve-pdf-blob-via-html5-file-and-url-apis
    function callAnalysisPlatform(analysisId, data, token, success, error) {
      //TODO: do something that works in IE
      var xhr = new XMLHttpRequest();
      var url = 'http://www.webatlas.no/WAAPI-AnalyseKatalog/analyses/' + analysisId + '/syncrun/';
      xhr.open('POST', url, true);
      xhr.responseType = 'blob';
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.setRequestHeader('X-WAAPI-TOKEN', token);

      xhr.onload = function(e) {
        if (this.status == 200) {
          success(this.response);
        } else {
          error(this.response);
        }
      };
      xhr.send(JSON.stringify(data));
    }

    var analysisId = 12;
    var token = '504AEB84-F291-4DEF-84BD-6E32C5C48B78';

    var spinner = $('#spinner');

    $('#runAnalysis').click(function(e) {
      spinner.removeClass('hidden');
      var data = {
        'Values': [{
          'Key': 'komm1',
          'Value': window.redCornerKomm
        }, {
          'Key': 'komm2',
          'Value': window.blueCornerKomm
        }]
      };


      callAnalysisPlatform(analysisId, data, token, function(blob) {
        spinner.addClass('hidden');
        openPdf(blob, redCornerKomm + '_vs_' + blueCornerKomm + '.pdf');
      }, console.error)
      e.stopPropagation();
    });

  }
})(Norkart);

window.onload = Norkart.main();