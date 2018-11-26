let exchangeRatesECB = (function () {
    const ratesURL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
    let rates = {};

    function getRates() {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', ratesURL);
            request.responseType = 'document';
            request.onload = () => {
                if (request.status === 200) {
                    resolve(request.response);
                } else {
                    reject(Error(`Data didn't load successfully; error code: ${request.statusText}`));
                }
            };
            request.onerror = () => {
                reject(Error('There was a network error.'));
            };
            request.send();
        });
    }
    
    getRates().then((response) => {
        rates = Array.from(response.querySelectorAll('Cube'))
            .filter((elem) => {
                return elem.attributes.length > 0;
            })
            .map((elem) => {
                return Object.values(Object.values(elem.attributes)).reduce(
                    (acc, cur) => {
                        const key = cur.name;
                        const val = cur.value;
                        acc[key] = val;
                        return acc;
                    }, {});
            })
            .reduce((acc, cur) => {
                if (cur.hasOwnProperty('time')) {
                    acc.date = cur.time;
                } else if (!acc.currencies) {
                    acc.currencies = [];
                    acc.currencies.push(cur);
                } else {
                    acc.currencies.push(cur);
                }
                return acc;
            }, {});
        // console.log(rates);
    }, (err) => {
        console.log(err);
    });

    return {
        getRates: getRates
    }

})();