'use strict';

function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ',';

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
}

function exportCSVFile(items, fileTitle) {
    // Convert Object to JSON
    //var jsonObject = JSON.stringify(items);
    var csv = jQuery.csv.fromObjects(items);

    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

    var blob = new Blob([ csv ], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
        var link = document.createElement('a');
        if (link.download !== undefined) {
            // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}


let saveData = [];
let fileName = '';
let do_get_data = false;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getProducts($doc) {
    const productsWrapper = $('#zg-ordered-list', $doc);
    const list = productsWrapper.find('.zg-item-immersion');
    var items = [];
    list.each(function() {
        let p = $(this);
		let item = {};
		
		let name = '';

		if ( p.find('.p13n-sc-truncated').length ) {
			name = p.find('.p13n-sc-truncated').attr( 'title' ) || false;
			if ( ! name ) {
				name = p.find('.p13n-sc-truncated').text().trim();
			}
		} else {
			name = p.find('.p13n-sc-truncate').text().trim();
		}

        let patt = /[^(\d+)\.(\d+)]/g;
        let pricetxt = p.find('.p13n-sc-price').text();
		let price = pricetxt.replace(patt, '');
		let url = p.find( 'a.a-link-normal' ).attr( 'href' );

		url = url.split( '/dp/' );
		url = url[1];
		url = url.split('/');

		price = parseFloat( price );
		if ( price >=  100 ) {
			item.sku = url[0];
			item.price = price;
			item.name = name;
			items.push(item);
		}
    });
    return items;
}

let products = [];

jQuery(document).ready(function($) {
    let button = $('<button id="amz-download">😱Download CSV</button>');
    button.css({
        position: 'fixed',
        zIndex: '999999999',
        bottom: '10px',
        right: '10px',
        padding: '10px',
        border: '0px none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '700',
        background: '#78a809',
        color: '#fff'
    });
    $('body').append(button);

    function ajax(url) {
		console.log( 'Ajax', url );
        $.ajax({
            url: url,
            success: function(html) {
                let $html = $(html);

                let items = getProducts($html);
                if (items.length) {
                    products = products.concat(items);
                }

                let nextLink = $('ul.a-pagination .a-selected', $html ).next('.a-normal');
                if (nextLink.length) {
                    let link = nextLink.find('a').attr('href');
                    $(document).trigger('amz_next_link', [ link ]);
                } else {
                    $(document).trigger('amz_all_done');
                }
            }
        });
    }

    $(document).on('amz_next_link', function(e, link) {
		ajax( link );
	});

    $(document).on('amz_all_done', function(e, data) {
		console.log( products );
		let title = $( '#zg-right-col h1' ).text();
		title = title.replace( 'Best Sellers in ', '' );
		title = title.toLowerCase();
		let fileName = title.replace( / /g, '-' );
		exportCSVFile( products, fileName );
	});

    button.on('click', function(e) {
        e.preventDefault();
        products = [];
        let items = getProducts($('body'));
        if (items.length) {
            products = products.concat(items);
        }
        let nextLink = $('ul.a-pagination .a-selected').next('.a-normal');
        if (nextLink.length) {
            let link = nextLink.find('a').attr('href');
            $(document).trigger('amz_next_link', [ link ]);
        } else {
            $(document).trigger('amz_all_done');
        }
    });

    //	exportCSVFile( saveData, fileName + '.csv' );
});
