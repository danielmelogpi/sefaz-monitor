var http = require('http'),
  cheerio = require('cheerio'),
  notifier = require("node-notifier"),
  path = require('path'),
  fs = require('fs');

var pureHtmlRequestcallback = function(response) {
  var str = '';
  response.on('data', function (chunk) {
    str += chunk;
  });
  response.on('end', function () {
    processPage(str);
  });
};

function processPage(content) {
  var ufs = extractUfStates(content);
  var ufsWarn = filterForCodes(ufs, [101,102]);
  if (ufsWarn.length) {
    ufsWarn.forEach(function (el) {
      gravarUf(el);
    });
    var ufsWarnNames = ufsWarn.map(function(curr) {
      return curr.Autorizador;
    });
    notifier.notify({
      title:'UFs com problemas',
      message: ufsWarnNames.join(', '),
      icon: ''
    }, function() {});
    log("There are possible problems!");
    log(ufsWarnNames.join(', '));
  } else {
    log("All good!");
  }
}

function extractUfStates(content) {
  var colunas = ["Autorizador", "Autorização", "Retorno Autorização", "Inutilização", "Consulta Protocolo", "Status Serviço", "Tempo Médio", "Consulta Cadastro", "Recepção Evento"];
  var resp = cheerio.load(content);
  var processedStatus = [];
  var ufs = [];
  resp('.tabelaListagemDados tr').each(function(i, line) {
    if (i === 0) return; //ignorar linha de titulo
    var ufData = {
      timestamp: Date.now()
    };
    cheerio.load(line)("td").each(function(i, cell) {
      var imgAtribs = cell.children[0].attribs;
      if (imgAtribs) {
        ufData[colunas[i]] = imgToStatus(imgAtribs.src);
      } else {
        ufData[colunas[i]] = cell.children[0].data;
      }
    });
    ufs.push(ufData);
  });

  return ufs;
}


function gravarUf(ufData) {
  var dataAsStr = JSON.stringify(ufData) + "\n";
  console.log(dataAsStr);
  fs.appendFile('data/nfe-indisponibilidade.txt', dataAsStr, {encoding: "utf8"} , function (err) {
    if (err) console.error("erro ao gravar dados");
    console.info("historico persistido");
  });
}

function filterForCodes(ufs, codes) {
  return ufs.filter(function someServiceHasProblem(uf) {
    var hasProblem = false;
    Object.keys(uf).forEach(function(service) {
      if (codes.indexOf(uf[service]) >= 0) {
        hasProblem = true;
      }
    });
    return hasProblem;
  });
}

function imgToStatus(imgSrc) {
  var map = {
    "imagens/bola_verde_P.png": 100,
    "imagens/bola_amarela_P.png": 101,
    "imagens/bola_vermelho_P.png": 102
  };
  return map[imgSrc];
}

function checkEnviroments() {
  log("checking autorization enviroments");
  var options = {
    host: 'www.nfe.fazenda.gov.br',
    path: '/portal/disponibilidade.aspx'
  };
  log("..done");
  http.request(options, pureHtmlRequestcallback).end();
}

function log(str) {
  console.info(new Date(), str);
}


var checkingInterval = process.argv[2]  || 1800000;
log("check interval is " + (checkingInterval/1000) + " seconds / " + (checkingInterval/(1000*60)) + " minutes");

checkEnviroments();
setInterval(checkEnviroments, checkingInterval);
