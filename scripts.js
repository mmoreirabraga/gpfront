const url = "https://publica.cnpj.ws/cnpj/"; //'https://receitaws.com.br/v1/cnpj/';
const options = {method: 'GET', headers: {Accept: 'application/json'}};


async function getCNPJ(){
  try{
    let valueInput = document.getElementById('cnpj').value.replace(".", "").replace("-", "").replace("/", "");
    if(valueInput === ''){
      return;
    }
    const response = await fetch(url+valueInput, options);
    const data = await response.json();
    if(data.status === 400 || data.status === 429){
      alert(data.detalhes);
      return;
    }

    let tipo_empresa = data.natureza_juridica.id === '1244' ? '2' :  !data.natureza_juridica.id.startsWith("1") ? '1' : '3';
    let responsavel = '';
    if( tipo_empresa === '3'){
      alert('A natureza juridica só pode ser de munícipio que é (1244) ou que seja de entidades empresarias a numeração da natureza juridica começa com 2 ou entidade sem fim lucrativos que começa com 3.');
      return;
    }
    if(tipo_empresa === '2'){
      responsavel = '';
    }else{
      responsavel = data.socios[0].nome;
    }

    insertFormulario('', data.razao_social, data.estabelecimento.cnpj, data.estabelecimento.email, responsavel , tipo_empresa);

  }catch(e){
    console.error(e);
    alert(e)
  }
}


/***
 * -----------------------------------------------------
 * retorna uma Promise que se resolve após o tempo especificado em milissegundos ter passado, estou usando esse método para evitar problemas no servidor com chamadas async em java script e também
 * na hora de carregar minha lista , ele esperar o tempo de limpar a tabela para depois inserir os dados
 * -----------------------------------------------------
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
  -------------------------------------------------------------------------------------
  Função para limpar a tabela de empresas
  -------------------------------------------------------------------------------------
*/

const clearEmpresas = async () => {
  const tabela = document.getElementById('myTableEmpresa');
  Array.from(tabela.rows).forEach((row, index) => {
    if (index > 0) {
      row.remove();
    }
  });

  await sleep(1000);
  getListEmpresas();
}

/*
  -------------------------------------------------------------------------------------
  Função para limpar a tabela áreas vinculada a empresa
  -------------------------------------------------------------------------------------
*/
const clearAreasDaEmpresa = async (empresaId) => {
  const tabela = document.getElementById('myTableArea');
  Array.from(tabela.rows).forEach((row, index) => {
    if (index > 0) {
      row.remove();
    }
  });

  await sleep(1000);
  carregarAreasIntencoesDaEmpresa(empresaId);
}

/*
-------------------------------------------
Função para limpar a tabela com os matches entre privados e prefeituras
-------------------------------------------
*/
const clearMatchesEmpresas = async () => {
  const tabela = document.getElementById('myTableMatches');
  Array.from(tabela.rows).forEach((row, index) => {
    if (index > 0) {
      row.remove();
    }
  });

  await sleep(1000)
  getListMatchesEntrePrivadoPrefeitura();
}

/*
  --------------------------------------------------------------------------------------
  Função para obter a lista de empresas existente do servidor via requisição GET
  --------------------------------------------------------------------------------------
*/
const getListEmpresas = async () => {
  let url = 'http://127.0.0.1:8000/empresas';
  fetch(url, {
    method: 'get'
  })
    .then((response) => response.json())
    .then((data) => {
      data[0].empresas.forEach(item => insertList(item.id, item.nome, item.cnpj, item.email, item.responsavel, item.tipoEmpresa['descricao']));
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
  --------------------------------------------------------------------------------------
  Função para obter a lista de empresas existente do servidor via requisição GET
  --------------------------------------------------------------------------------------
*/
const getListAreasEmpresas = async () => {
  let url = 'http://127.0.0.1:8000/listarAreasEmpresa';
  fetch(url, {
    method: 'get',
  })
    .then((response) => response.json())
    .then((data) => {
      data[0].areasIntencoes.forEach(item => insertAreasDaEmpresa(item.id, item.descricao));
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

/*
-------------------------------------------
Função para carregar todos os matches entree privados e prefeituras
-------------------------------------------
*/
const getListMatchesEntrePrivadoPrefeitura = async () => {
  let url = 'http://127.0.0.1:8000/matches'

  await sleep(1000);
  fetch(url, {
    method: 'get'
  })
    .then((response) => {
    if (!response.ok) {
        throw response;
    }
    return response.json()
  })
    .then((data) => {
      if(data[0].matchesEmpresas){
        data[0].matchesEmpresas.forEach((match) => {
          insertMatches(match.nomePrivado, match.cnpjPrivado, match.tipoEmpPriv, match.descAreaPriv, match.nomePrefeitura, match.cnpjPrefeitura, match.tipoEmpPref, match.descAreaPref);
        })
      }

    })
    .catch((error) => {
      console.log('Error: ' + error)
    });

}

/*
  --------------------------------------------------------------------------------------
  Chamada da função para carregamento inicial dos dados da empresa e matches
  --------------------------------------------------------------------------------------
*/
getListEmpresas();
getListMatchesEntrePrivadoPrefeitura();


/*
  --------------------------------------------------------------------------------------
  Função para colocar uma empresa na lista do servidor via requisição PUT ou POST
  --------------------------------------------------------------------------------------
*/
const submitEmpresa = async (formData, metodo) => {

  let url = 'http://127.0.0.1:8000/empresa';
  fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData))
  })
    .then((response) => {

      if (!response.ok) {
        throw response;
      }
      if (metodo === 'PUT') {
        alert("Empresa Editada!");
        let iCnpj = document.getElementById("cnpj");
        let iEmail = document.getElementById("email");
        let inputId = document.getElementById("id");
        iCnpj.readOnly = false;
        iEmail.readOnly = false;
        const btnEditEmpresa = document.getElementById('btnEditarEmpresa');
        const btnIncluirEmpresa = document.getElementById('btnIncluirEmpresa');
        btnIncluirEmpresa.style.display = 'inline-block';
        btnEditEmpresa.style.display = 'none';
        inputId.disabled = true;
        inputId.readOnly = false;
      } else {
        alert("Empresa Adicionada!");
        removerErrosNosCampos();
      }
      clearEmpresas();
      clearMatchesEmpresas();
      return response.json();
    })
    .catch((error) => {
      if (error.status === 422) {
        error.json().then(errorMessage => {
          console.log(errorMessage)
          invalidFeedback(errorMessage);
        });
      } else {
        console.log('Erro:', error.statusText);
      }

    });

  await sleep(1000);
}

/*
---------------------------------------------------------------------------------------
Função para colocar uma área de intenção vinculada a empresa
---------------------------------------------------------------------------------------
*/
const submitAreaDaEmpresa = async (formData) => {
  let url = 'http://127.0.0.1:8000/empresaArea';
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData))
  }).then((response) => {

    if (!response.ok) {
      throw response;
    }

    alert("Área vinculada a empresa!");
    clearAreasDaEmpresa(document.getElementById('empresaId').value);
    return response.json();
  })
  .catch((error) => {
    console.log('Error: '+ error);
  });
}
/*
  --------------------------------------------------------------------------------------
  Função para criar um botão excluir e edtiar para cada empresa da lista
  --------------------------------------------------------------------------------------
*/
const insertButton = (parent) => {
  // editar
  let spanEditar = document.createElement("span");
  // estilo editar
  spanEditar.style.cursor = 'pointer';
  spanEditar.style.backgroundColor = 'lightblue';
  spanEditar.style.padding = '10px';
  spanEditar.style.borderRadius = '5px';
  spanEditar.style.marginRight = '5px';
  let txtEdit = document.createTextNode("Editar");
  spanEditar.className = "editar"
  spanEditar.appendChild(txtEdit)
  parent.appendChild(spanEditar);
  // fim editar
  // excluir
  let spanExcluir = document.createElement("span");
  // estilo eexcluir
  spanExcluir.style.cursor = 'pointer';
  spanExcluir.style.backgroundColor = 'red';
  spanExcluir.style.padding = '10px';
  spanExcluir.style.borderRadius = '5px';
  spanExcluir.style.marginRight = '5px';
  let txtExcluir = document.createTextNode("Excluir");
  spanExcluir.className = "excluir";
  spanExcluir.appendChild(txtExcluir);
  parent.appendChild(spanExcluir);
  // fim excluir

  //  area de intenção
  let spanArea = document.createElement("button");
  // estilo area intenção
  spanArea.style.backgroundColor = '#ffff00';
  spanArea.style.padding = '10px';
  spanArea.style.borderRadius = '5px';
  let txtArea = document.createTextNode("Área");
  spanArea.className = "areaIntencao";
  spanArea.title = "Área de intenção";
  spanArea.appendChild(txtArea);
  parent.appendChild(spanArea);
}

/*
  --------------------------------------------------------------------------------------
  Função para criar um botão excluir área
  --------------------------------------------------------------------------------------
*/

const insertAreaButton = (parent) => {
  let spanExcluirArea = document.createElement("span");
  // estilo excluir
  spanExcluirArea.style.cursor = 'pointer';
  spanExcluirArea.style.backgroundColor = 'red';
  spanExcluirArea.style.padding = '10px';
  spanExcluirArea.style.borderRadius = '5px';
  spanExcluirArea.style.marginRight = '5px';
  let txtExcluirArea = document.createTextNode("Excluir");
  spanExcluirArea.className = "excluirArea";
  spanExcluirArea.appendChild(txtExcluirArea);
  parent.appendChild(spanExcluirArea);
  // fim excluir
}


/*
  --------------------------------------------------------------------------------------
  Função para remover uma empresa da lista de acordo com o click no botão excluir
  --------------------------------------------------------------------------------------
*/
const removeElement = () => {
  let excluir = document.getElementsByClassName("excluir");
  // var table = document.getElementById('myTable');
  let i;
  for (i = 0; i < excluir.length; i++) {
    excluir[i].onclick = function () {
      let div = this.parentElement.parentElement;
      const idEmpresa = div.getElementsByTagName('td')[0].innerHTML
      if (confirm("Você tem certeza?")) {
        //div.remove();
        deleteItem(idEmpresa);
        alert("Removido!");
        clearEmpresas();
        clearMatchesEmpresas();
      }
    }
  }
}

/*
  ----------------------------------------------------------------------------------------
  Função para editar uma empresa da lista de acordo com o click no botão editar
  ----------------------------------------------------------------------------------------
*/
const editElement = () => {
  let editar = document.getElementsByClassName("editar");
  let i;
  for (let i = 0; i < editar.length; i++) {
    editar[i].onclick = function () {
      let div = this.parentElement.parentElement;
      const idEmpresa = div.getElementsByTagName('td')[0].innerHTML;
      const btnEditEmpresa = document.getElementById('btnEditarEmpresa');
      const btnIncluirEmpresa = document.getElementById('btnIncluirEmpresa');
      let inputCnpj = document.getElementById("cnpj");
      let inputEmail = document.getElementById("email");
      let inputId = document.getElementById("id");
      inputCnpj.readOnly = true;
      inputEmail.readOnly = true;
      inputId.disabled = false;
      inputId.readOnly = true;
      div.style.display = 'none';
      btnIncluirEmpresa.style.display = 'none';
      btnEditEmpresa.style.display = 'inline-block';
      disableButtonTable();
      carregarEmpresa(idEmpresa);
    }

  }
}
/*
---------------------------------------------------------------------------------------------
Função para abrir modal área de intenção e cadastrar área de intenção para cada empresa
---------------------------------------------------------------------------------------------
*/
const areaIntencaoElement = () => {
  let area = document.getElementsByClassName('areaIntencao');

  for (let index = 0; index < area.length; index++) {
    area[index].onclick = function() {
      let div = this.parentElement.parentElement;
      const idEmpresa = div.getElementsByTagName('td')[0].innerHTML;
      const nomeEmpresa = div.getElementsByTagName('td')[1].innerHTML;
      this.setAttribute("data-toggle", "modal");
      this.setAttribute("data-target", "#areaIntencao");
      document.getElementById('empresaId').value = idEmpresa;
      carregarAreaIntencoes(nomeEmpresa);
      clearAreasDaEmpresa(idEmpresa);
    }
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para remover uma área vinculada a empresa da lista de acordo com o click no botão excluir
  --------------------------------------------------------------------------------------
*/
const removeAreaElement = () => {
  let areaEmpresa = document.getElementsByClassName('excluirArea');
  let idEmpresa = document.getElementById('empresaId').value;
  for (let index = 0; index < areaEmpresa.length; index++) {
      areaEmpresa[index].onclick = function() {
      let div = this.parentElement.parentElement;
      const idArea = div.getElementsByTagName('td')[0].innerHTML;
      if (confirm("Você tem certeza?")) {
        //div.remove();
        deleteAreaVinculadaEmpresa(idEmpresa, idArea);
        alert("Removido!");
        clearAreasDaEmpresa(idEmpresa);
      }

    }

  }
}

/*
  --------------------------------------------------------------------------------------
  Função para deletar uma empresa da lista do servidor via requisição DELETE
  --------------------------------------------------------------------------------------
*/
const deleteItem = async (id) => {
  console.log(id)
  let url = 'http://127.0.0.1:8000/empresa?id=' + id;
  fetch(url, {
    method: 'delete'
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error:', error);
    });
  await sleep(1000);
}

/*
  --------------------------------------------------------------------------------------
  Função para deletar uma área de intenção vinculada a empresa da lista do servidor via requisição DELETE
  --------------------------------------------------------------------------------------
*/
const deleteAreaVinculadaEmpresa = async (idEmpresa, idAreaIntencao) => {
  console.log(id)
  let url = 'http://127.0.0.1:8000/empresaArea?id_empresa=' + idEmpresa + '&id_area_intencao='+ idAreaIntencao;
  fetch(url, {
    method: 'delete'
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data[0].mensagem);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  await sleep(1000);
}

/*
  ---------------------------------------------------------------------------------------
  Função para carregar a empresa passando o id como requisição
  ---------------------------------------------------------------------------------------
*/
const carregarEmpresa = async (id) => {
  let url = 'http://127.0.0.1:8000/empresa?id=' + id;
  fetch(url, {
    method: 'get'
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data[0]);
      insertFormulario(data[0].id, data[0].nome, data[0].cnpj, data[0].email, data[0].responsavel, data[0].tipoEmpresa['tipo']);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  await sleep(1000);
}

/*
  ---------------------------------------------------------------------------------------
  Função para carregar todas as áreas de intenções
  ---------------------------------------------------------------------------------------
*/
const carregarAreaIntencoes = async (nome) => {
  document.getElementById('staticBackdropLabel').textContent = `Área(s) de intenção(ões): ${nome}`;
  let url = 'http://127.0.0.1:8000/areasIntencoes';
  fetch(url, {
    method: 'get'
  })
    .then((response) => response.json())
    .then((data) => {
      let select = document.getElementById("areaIntencaoId");
      select.innerHTML = "";
      data[0].areasIntencoes.forEach((area) => {
        let option = document.createElement("option");
        option.id = area.id;
        option.value = area.id;
        option.text = area.descricao;
        select.add(option);
      })
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  await sleep(1000);
}

/*
---------------------------------------------------------------------------------------
  Função para carregar todas as áreas de intenções vinculadas a empresa selecionada
---------------------------------------------------------------------------------------
*/
const carregarAreasIntencoesDaEmpresa = async (id) => {
  let url = 'http://127.0.0.1:8000/listarAreasEmpresa?id='+id;

  await sleep(1000);
  fetch(url, {
    method: 'get'
  })
    .then((response) => {
    if (!response.ok) {
        throw response;
    }
    return response.json()
  })
    .then((data) => {
      console.log(data);
      if(data[0].areasIntencoes){
        data[0].areasIntencoes.forEach((area) => {
          insertAreasDaEmpresa(area.id, area.descricao);
        })
      }else{
        alert("mensagem: "+data[0].mensagem+ '. Status: '+ data[1]);
      }

    })
    .catch((error) => {
      console.log('Error: ' + error)
    });

}



/*
  -----------------------------------------------------------------------------------------
  desabilitar todos os botões da tabela de empresa
  -----------------------------------------------------------------------------------------
*/
const disableButtonTable = () => {
  let elementosEdit = document.getElementsByClassName('editar');
  let elementosRemove = document.getElementsByClassName('excluir');

  for (let index = 0; index < elementosEdit.length; index++) {
    elementosEdit[index].onclick = null;
    elementosEdit[index].style.cursor = 'not-allowed';
  }
  for (let index = 0; index < elementosRemove.length; index++) {
    elementosRemove[index].onclick = null;
    elementosRemove[index].style.cursor = 'not-allowed';
  }
}

/*
  --------------------------------------------------------------------------------------
  Função para adicionar uma nova empresa ou editar uma nova empresa
  --------------------------------------------------------------------------------------
*/
document.getElementById('formEmpresa').addEventListener('submit', function (event) {

  // evita o comportamento padrão do formulário
  event.preventDefault();

  // obtem os dados do formulário
  const formData = new FormData(this);
  const valor = isNaN(parseInt(document.getElementById('id').value)) ? 0 : parseInt(document.getElementById('id').value);
  const metodo = valor === 0 ? 'POST' : 'PUT';
  // envia solicitação ajax
  submitEmpresa(formData, metodo);
});


/*
  --------------------------------------------------------------------------------------
  Função para adicionar uma nova area de intenção vinculada a empresa
  --------------------------------------------------------------------------------------
*/
document.getElementById('formArea').addEventListener('submit', function (event) {

  // evita o comportamento padrão do formulário
  event.preventDefault();

  // obtem os dados do formulário
  const formData = new FormData(this);
  // envia solicitação ajax
  submitAreaDaEmpresa(formData);
});

/*
  --------------------------------------------------------------------------------------
  Função para inserir empresas na lista apresentada
  --------------------------------------------------------------------------------------
*/
const insertList = (id, nome, cnpj, email, responsavel, tipoEmpresa) => {
  let item = [id, nome, cnpj, email, responsavel, tipoEmpresa];
  let table = document.getElementById('myTableEmpresa').tBodies[0];
  let row = table.insertRow();

  for (var i = 0; i < item.length; i++) {
    let cel = row.insertCell(i);
    cel.textContent = item[i];
  }
  insertButton(row.insertCell(-1))
  insertFormulario('', '', '', '', '', '');

  removeElement();
  editElement();
  areaIntencaoElement();
}

/*
---------------------------------------------------
  Função para inserir areas de intenções da empresa
---------------------------------------------------
*/
const insertAreasDaEmpresa = (id, descricao) => {
  let areasDasEmpresas = [id, descricao];
  let tableArea = document.getElementById('myTableArea').tBodies[0];
  let rowArea = tableArea.insertRow();
  for (let i = 0; i < areasDasEmpresas.length; i++) {
    let cel = rowArea.insertCell(i);
    cel.textContent = areasDasEmpresas[i];
  }
  insertAreaButton(rowArea.insertCell(-1))
  removeAreaElement();
}

/*
---------------------------------------------------
  Função para inserir matches entre empresas (privado e prefeitura)
---------------------------------------------------
*/
const insertMatches = (nomePrivado, cnpjPrivado, tipoEmpPriv, descAreaPriv, nomePrefeitura, cnpjPrefeitura, tipoEmpPref, descAreaPref) => {
  let matches = [nomePrivado, cnpjPrivado, tipoEmpPriv, descAreaPriv, nomePrefeitura, cnpjPrefeitura, tipoEmpPref, descAreaPref];
  let tableMatch = document.getElementById('myTableMatches').tBodies[0];
  let rowMatch = tableMatch.insertRow();
  for (let i = 0; i < matches.length; i++) {
    let cel = rowMatch.insertCell(i);
    cel.textContent = matches[i];
  }
}

/*
  ---------------------------------------------------------------------------------------
  Função para inserir no formulário da empresa
  ---------------------------------------------------------------------------------------
*/
const insertFormulario = (id, nome, cnpj, email, responsavel, tipoEmpresa) => {
  document.getElementById("id").value = id;
  document.getElementById("nome").value = nome;
  document.getElementById("cnpj").value = cnpj;
  document.getElementById("email").value = email;
  document.getElementById("resposanvel").value = responsavel;
  document.getElementById("tipoEmpresa").value = tipoEmpresa;
}

/*
  ---------------------------------------------------------------------------------------
  Função para cancelar o formulario da empresa, tanto incluir como editar
  ---------------------------------------------------------------------------------------
*/
const cancelEmpresa = () => {
  let inputId = document.getElementById("id");
  let iCnpj = document.getElementById("cnpj");
  let iEmail = document.getElementById("email");
  iCnpj.readOnly = false;
  iEmail.readOnly = false;
  //
  inputId.disabled = true;
  inputId.readOnly = false;
  //
  const btnEditEmpresa = document.getElementById('btnEditarEmpresa');
  const btnIncluirEmpresa = document.getElementById('btnIncluirEmpresa');
  btnIncluirEmpresa.style.display = 'inline-block';
  btnEditEmpresa.style.display = 'none';
  const invalidFeedback = document.querySelectorAll('.invalid-feedback');
  removerErrosNosCampos();
  if (inputId.value !== '') {
    clearEmpresas();
  }
  insertFormulario('', '', '', '', '', '');
}

const removerErrosNosCampos = () => {
  const invalidFeedback = document.querySelectorAll('.invalid-feedback');
  invalidFeedback.forEach((el) => {
    el.style.display = 'none';
    el.innerHTML = '';
  });
  // obtém todos os elementos do formulário
  const formInputs = document.querySelectorAll('input, select');

  // remove a classe is-invalid de todos os elementos do formulário
  formInputs.forEach(input => {
    input.classList.remove('is-invalid');
  });
}

/*
  ---------------------------------------------------------------------------------------
  Função colocar feedback invalidação de campo do lado do servidor.
  ---------------------------------------------------------------------------------------
*/
const invalidFeedback = (errorMensagem) => {

  errorMensagem.detail.forEach((item) => {
    Object.keys(item).forEach((key) => {
      const input = document.querySelector(`input[name='${key}']`) == undefined ? document.querySelector(`select[name='${key}']`) : document.querySelector(`input[name='${key}']`);
      const inputParent = input.parentElement;
      const invalidFeedback = inputParent.nextElementSibling;
      invalidFeedback.style.display = "block";
      invalidFeedback.textContent = item[key];
      input.classList.add('is-invalid');
    });
  });
}

$('#areaIntencao').on('hidden.bs.modal', function (event) {

  clearMatchesEmpresas();
})