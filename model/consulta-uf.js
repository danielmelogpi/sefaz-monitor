var propsNfe = ["autorizador",
"autorizacao",
"retornoAutorizacao",
"inutilizacao",
"consultaProtocolo",
"statusServico",
"tempoMedio",
"consultaCadastro",
"recepcaoEvento"];

function StatusUfNfe() {
  props.forEach(function (el) {
    Object.defineProperty(this, el, {});
  });
}

var TipoStatusNfe = Object.freeze({
  UP: 100,
  WARN: 101,
  DOWN: 102
});

module.exports = {
  propsNfe: propsNfe,
  StatusUfNfe: StatusUfNfe,
  TipoStatusNfe: TipoStatusNfe
};
