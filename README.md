# MVP SPRING PUC-RIO - Desenvolvimento Back-end Avançado

Esse repositorio contém o frontend do terceiro MVP para a pós-graduação em desenvolvimento Full Stack.
Nesse projeto criei uma aplicação que possibilita conectar prefeituras e empresas privadas para
possiveis parcerias públicas e privadas as PPPs

## Quais tecnologias e framerworks foram utilizados

Framework bootstrap 4.6.
html, css, javascript

---

## Arquitetura

Foram utilizados três componentes denominados A, B e C. Sendo que:

<img src="/img/DiagramaAplicacao.jpg">

**Componente A**: FRONT-END da aplicação deenvolvido em HTML, CSS e Java Script.

**Componente B**: API do [CNPJ.ws](https://www.cnpj.ws/) para buscar pessoas juridicas na hora de buscar uma prefeitura ou empresa privada. OBS: A API Pública possui a limitação de atender apenas 3 requisições por minuto de um mesmo IP, entenda que essa limitação é independente ao fato de a consulta ter obtido sucesso ao encontrar o CNPJ. Após ultrapassar esse limite o requisitante terá que aguardar completar os 60 segundos para poder fazer a próxima requisição.

**Componente C**: BACK-END da aplicação desenvolvida em FAST-API. O código está presente [respositório](https://github.com/mmoreirabraga/gpapi)

## Como instalar

Clone o repositório localmente.

Dentro do repositório local, realize o build da imagem do docker com o seguinte comando:

```bash
    docker build -t gpfront:1.0.0 .
```

## Como executar

Após completar o build da imagem do docker, execute-o o seguinte comando:

```bash
    docker run -p 8080:80 gpfront:1.0.0
```
