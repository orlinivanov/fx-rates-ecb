let exchangeRatesECB = (function () {
    let rates = {};
    
    function getRatesData() {
        const ratesURL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
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
    
    getRatesData().then((response) => {
        rates = Array.from(response.querySelectorAll('Cube'))
            .filter((elem) => {
                return elem.attributes.length > 0;
            })
            .map((elem) => {
                return Object.values(Object.values(elem.attributes)).reduce(
                    (acc, cur) => {
                        const key = cur.name.toLowerCase();
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
    }, (err) => {
        console.log(err);
    });

    function updateRates() {
        if (rates.hasOwnProperty('date')) {
            let today = new Date();
            let yesterday = new Date();
            if (today.getDay() !== 1) {
                yesterday.setDate(today.getDate() - 1);
            } else {
                yesterday.setDate(today.getDate() - 3);
            }
            let todayFrmatted = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            let yesterdayFormatted = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
            if (rates.date === todayFrmatted || rates.date === yesterdayFormatted) {
                return false;
            }
        }
        getRatesData();
        return true;
    }

    function listCurrencies() {
        if (rates.hasOwnProperty('currencies')) {
            return rates.currencies.map((currencyDetails) => {
                return currencyDetails.currency;
            });
        } else {
            return [];
        }
    }

    function getFxRateOf(currency) {
        return rates.currencies
            .filter((currencyDetails) => {
                return currencyDetails.currency.toLowerCase() === currency.toLowerCase();
            })    
            .map((currencyDetails) => {
                return currencyDetails.rate;
            })[0];
    }

    function convertAmountToEur(amount, currency) {
        updateRates();
        const fxRate = getFxRateOf(currency);

        return parseFloat(amount / fxRate);
    }

    function convertAmountFromTo(amount, fromCurrency, toCurrency) {
        const amountInEur = convertAmountToEur(amount, fromCurrency);
        const fxRate = getFxRateOf(toCurrency);

        return parseFloat(amountInEur * fxRate);
    }

    function toJSON() {
        return JSON.stringify(rates);
    }

    return {
        updateRates,
        listCurrencies,
        convertAmountToEur,
        convertAmountFromTo,
        toJSON
    }
})();