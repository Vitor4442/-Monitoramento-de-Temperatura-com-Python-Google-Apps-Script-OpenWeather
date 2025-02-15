function doGet(e) {

  if (!e.parameter.cidade) {
    return ContentService.createTextOutput("Erro: Parâmetro 'cidade' não fornecido.");
  }
  
  // Obtém o valor do parâmetro 'cidade' da URL
  var cidade = e.parameter.cidade; 
  obterClima(cidade);
  var media = calcularMediaUltimasSeisTemperaturas(cidade);
  var lista = obterUltimosSeis(cidade);


  return ContentService.createTextOutput(JSON.stringify({ "media": media, "ultimos": lista,"cidade":cidade }))
    .setMimeType(ContentService.MimeType.JSON);
}

var historicoClima_ubatuba = []; // Lista global para armazenar os dados
var historicoClima_taubate = [];
var historicoClima_cacapava = [];

function atualizarcidades(){

  obterClima('cacapava');
  obterClima('taubate');
  obterClima('ubatuba');
  
}

function adicionarDadoAoHistorico(cidade,novoDado) {

  switch(cidade){

    case 'ubatuba':
    historicoClima_ubatuba.push(novoDado);
    break;

    case 'taubate':
    historicoClima_taubate.push(novoDado);
    break;

    case 'cacapava':
    historicoClima_cacapava.push(novoDado);
    break;

    default:
    Logger.log("cidade invalida");
  }

  salvarHistoricos(); // Salva automaticamente após adicionar
}

function obterUltimosSeis(cidade) {
  carregarHistorico();

   switch(cidade){

    case 'ubatuba':
    return historicoClima_ubatuba.slice(-6);;
    break;

    case 'taubate':
    return historicoClima_taubate.slice(-6);

    break;

    case 'cacapava':
    return historicoClima_cacapava.slice(-6);
    break;

    default:
     return ("cidade invalida");
  }
}

function salvarHistoricos() {
  PropertiesService.getScriptProperties().setProperty('historico_ubatuba', JSON.stringify(historicoClima_ubatuba));
  PropertiesService.getScriptProperties().setProperty('historico_taubate', JSON.stringify(historicoClima_taubate));
  PropertiesService.getScriptProperties().setProperty('historico_cacapava', JSON.stringify(historicoClima_cacapava));
}

function carregarHistorico() {
  var historicoSalvo = PropertiesService.getScriptProperties().getProperty('historico_ubatuba');
  if (historicoSalvo) {
    historicoClima_ubatuba = JSON.parse(historicoSalvo);
  }
  
   var historicoSalvo = PropertiesService.getScriptProperties().getProperty('historico_taubate');
   if (historicoSalvo) {
    historicoClima_taubate = JSON.parse(historicoSalvo);
  }

  var historicoSalvo = PropertiesService.getScriptProperties().getProperty('historico_cacapava');
   if (historicoSalvo) {
    historicoClima_cacapava = JSON.parse(historicoSalvo);
  }
   
}

function obterClima(cidade) {
  var url = `http://api.openweathermap.org/data/2.5/weather?q=${cidade},BR&appid=ca9990a9d0b50ecc5e6851175cea8e2b&units=metric&lang=pt`;

  try {
    var resposta = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var codigoResposta = resposta.getResponseCode();

    if (codigoResposta === 200) {
      var json = resposta.getContentText();
      var dados = JSON.parse(json);

      carregarHistorico();
      adicionarDadoAoHistorico(cidade,dados.main.temp); // Adiciona temperatura à lista
      
      Logger.log(dados);
     
      return dados;
    } else {
      Logger.log('Erro na requisição: ' + codigoResposta);
      return null;
    }
  } catch (erro) {
    Logger.log('Erro ao buscar dados: ' + erro.toString());
    return null;
  }
} 

function calcularMediaUltimasSeisTemperaturas(cidade) {
  carregarHistorico(); // Certifica-se de que o histórico está carregado
  var ultimasSeisTemperaturas = obterUltimosSeis(cidade); // Obtém as últimas 6 temperaturas

  if (ultimasSeisTemperaturas.length === 0) {
    Logger.log("Nenhuma temperatura disponível para calcular a média.");
    return 0; // Retorna 0 se não houver temperaturas
  }

  var soma = ultimasSeisTemperaturas.reduce((acc, temp) => acc + temp, 0); // Soma as temperaturas
  var media = soma / ultimasSeisTemperaturas.length; // Calcula a média

  Logger.log('Média das últimas 6 temperaturas: ' + media);
  return media; // Retorna a média
}
