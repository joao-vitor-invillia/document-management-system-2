# Especificação - Document Management System

**Versão:** 1.0  
**Status:** especificação para implementação futura  
**Data:** 2026-09-23

## 1. Objetivo

Entregar um sistema web simples para que usuários enviem, consultem e baixem documentos, mantendo os arquivos no filesystem local da aplicação e seus metadados em memória.

Esta especificação descreve o comportamento esperado e o plano de implementação. Ela não executa nem autoriza, nesta etapa, alterações nos arquivos de back-end ou front-end.

## 2. Escopo

### 2.1 Dentro do escopo

- Upload de um documento por requisição.
- Geração de identificador único para cada documento.
- Registro dos metadados do documento.
- Associação do documento a um usuário proprietário.
- Listagem dos documentos disponíveis ao usuário.
- Download do conteúdo binário de um documento pelo identificador.
- Armazenamento dos bytes no filesystem local, em `backend/storage`.
- Manutenção dos metadados em memória durante a execução do processo.
- Interface React para upload, listagem e download.
- Integração do frontend com o backend por `fetch` e pelo prefixo `/api` do proxy do Vite.
- Endpoint operacional `GET /health`.

### 2.2 Fora do escopo

- Armazenamento externo, em nuvem ou em serviços de terceiros.
- Banco de dados ou persistência durável dos metadados nesta versão.
- Versionamento, histórico ou restauração de documentos.
- Edição, conversão, visualização ou processamento do conteúdo dos arquivos.
- Autenticação, autorização completa, cadastro e administração de usuários.
- Compartilhamento entre usuários, pastas, tags, busca avançada ou exclusão de documentos.
- Upload múltiplo em uma única requisição.
- Execução das etapas de implementação descritas neste documento.

### 2.3 Estado inicial conhecido

O seed atual contém apenas o endpoint `GET /health` no [app.js](../../backend/src/app.js). Os diretórios de `routes`, `controllers`, `services` e `repositories`, assim como os componentes específicos do frontend, estão preparados para receber a implementação futura.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento por `multipart/form-data`. | Uma requisição válida com um arquivo no campo `file` cria um registro e grava os bytes em `backend/storage`. |
| RF-02 | O sistema deve aceitar somente um arquivo por upload. | Requisições sem arquivo ou com mais de um arquivo são rejeitadas com erro HTTP previsível. |
| RF-03 | O sistema deve gerar um identificador único para cada documento. | Cada upload aceito retorna um `id` não vazio e diferente dos IDs já registrados. |
| RF-04 | O sistema deve registrar os metadados do documento. | A resposta do upload contém `id`, `originalName`, `size`, `uploadedAt` e `owner`. |
| RF-05 | O sistema deve associar cada documento a um proprietário. | O proprietário é obtido do contexto de usuário disponível na requisição; na ausência de autenticação real, a implementação deve usar o mecanismo de contexto definido pela configuração do ambiente. |
| RF-06 | O usuário pode listar documentos. | `GET /documents` retorna uma lista JSON de metadados, sem expor o caminho físico do arquivo. |
| RF-07 | A listagem deve respeitar o usuário proprietário quando houver contexto de usuário. | A resposta não deve incluir documentos de outro proprietário, salvo regra explícita de acesso administrativo, que não faz parte desta versão. |
| RF-08 | O usuário pode baixar um documento pelo identificador. | `GET /documents/:id/download` retorna os bytes do arquivo correspondente e cabeçalho de download com o nome original. |
| RF-09 | O sistema deve rejeitar identificadores inexistentes. | O download de um ID não registrado retorna `404` em JSON, sem tentar acessar caminho derivado diretamente da entrada do usuário. |
| RF-10 | O sistema deve tratar arquivo físico ausente ou ilegível. | Uma inconsistência entre metadados e filesystem retorna erro controlado e não expõe detalhes internos. |
| RF-11 | O frontend deve oferecer os fluxos principais. | A interface possui upload, listagem de documentos e ação de download, consumindo a API por `fetch`. |
| RF-12 | O sistema deve expor verificação de saúde. | `GET /health` retorna `{ "status": "ok" }` quando o processo está disponível. |

### 3.1 Regras de validação

- O campo multipart canônico é `file`.
- O upload deve conter exatamente um arquivo não vazio.
- O nome original deve ser preservado apenas como metadado e como nome sugerido no download; ele não pode controlar diretamente o caminho físico.
- O tamanho deve ser informado em bytes e corresponder ao arquivo recebido.
- `uploadedAt` deve ser uma data/hora válida em ISO 8601.
- O `id` deve ser tratado como valor opaco e validado antes da consulta ao repository.
- Limite de tamanho e tipos MIME permitidos devem ser configuráveis por variáveis de ambiente quando a implementação definir essas políticas.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js com Express e CommonJS, conforme `backend/package.json`. |
| RNF-02 | O frontend deve usar React com Vite e módulos ESM, conforme `frontend/package.json`. |
| RNF-03 | Os arquivos devem ser gravados exclusivamente no filesystem local, em `backend/storage`, usando `multer` com `diskStorage`. |
| RNF-04 | Os metadados devem permanecer em memória nesta fase; reiniciar o processo pode perder o índice dos documentos. |
| RNF-05 | A aplicação deve seguir configuração por variáveis de ambiente, preservando o princípio 12-Factor. |
| RNF-06 | O backend deve respeitar a Clean Architecture simples: `routes -> controllers -> services -> repositories`. |
| RNF-07 | Cada camada deve ter responsabilidade única e não deve depender de detalhes de camadas mais externas. |
| RNF-08 | Erros de entrada, filesystem e regras de negócio devem ser tratados nos limites apropriados e convertidos em respostas HTTP previsíveis. |
| RNF-09 | O caminho físico deve ser controlado pelo repository; nenhum caminho deve ser montado diretamente a partir de entrada não validada do usuário. |
| RNF-10 | A API deve usar JSON para respostas de sucesso de metadados e para erros, exceto o corpo binário do download. |
| RNF-11 | A implementação futura deve ter testes de API e de regras principais usando o runner nativo `node:test`. |
| RNF-12 | A interface deve funcionar através do proxy do Vite, que encaminha `/api` para o backend local. |

### 4.1 Configuração mínima prevista

| Variável | Uso | Padrão previsto |
| --- | --- | --- |
| `PORT` | Porta HTTP do backend | `3000` |
| `STORAGE_DIR` | Diretório dos arquivos enviados | `backend/storage` |
| `MAX_FILE_SIZE` | Limite de tamanho do upload em bytes | Definido na implementação |
| `ALLOWED_MIME_TYPES` | Tipos MIME permitidos, se habilitado | Sem restrição adicional nesta especificação |
| `DEFAULT_OWNER` | Identificador usado quando não houver contexto de autenticação | Definido na implementação |

Os nomes e valores padrão acima devem ser confirmados na etapa de implementação sem introduzir armazenamento externo.

## 5. Modelo de dados

### 5.1 Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` | Sim | Identificador único e opaco do documento. |
| `originalName` | `string` | Sim | Nome original informado pelo cliente, usado como metadado e nome sugerido no download. |
| `size` | `number` | Sim | Tamanho do arquivo em bytes; deve ser inteiro não negativo. |
| `uploadedAt` | `string` | Sim | Data/hora do upload em formato ISO 8601. |
| `owner` | `string` | Sim | Identificador do usuário proprietário. |

### 5.2 Registro interno de persistência

O repository pode manter um campo interno, não retornado pela API, para localizar o arquivo gravado:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `storageName` | `string` | Sim | Nome seguro gerado para o arquivo dentro de `STORAGE_DIR`. Não deve ser derivado diretamente de `originalName`. |
| `storagePath` | `string` | Sim | Caminho resolvido pelo repository para leitura do arquivo local. Não deve ser exposto ao cliente. |

O campo interno pode ser representado de outra forma, desde que o contrato público e as regras de segurança sejam preservados.

### 5.3 Invariantes e ciclo de vida

- `id` é único dentro do processo e permanece associado ao mesmo arquivo durante a vida do registro.
- `originalName` nunca deve ser usado sem sanitização para montar um caminho.
- O arquivo físico deve ser gravado antes que o metadado seja considerado criado com sucesso.
- Se o registro em memória não puder ser criado depois da gravação, a implementação deve tentar remover o arquivo recém-criado para evitar órfãos.
- Se um arquivo físico não existir para um metadado conhecido, o download deve retornar erro controlado.
- Como o índice é volátil, a reinicialização pode deixar arquivos sem metadados; reconciliação e limpeza automática ficam fora do escopo.

## 6. Contratos de API

### 6.1 Convenções gerais

- As rotas são expostas pelo backend sem prefixo: `/upload`, `/documents` e `/documents/:id/download`.
- O frontend usa o prefixo `/api`; o proxy configurado em `frontend/vite.config.js` remove esse prefixo e encaminha para o backend. Assim, o frontend chama `/api/documents`, enquanto o backend recebe `/documents`.
- Respostas de metadados e erros usam `Content-Type: application/json; charset=utf-8`.
- Datas são strings ISO 8601; tamanhos são números em bytes.
- Os exemplos abaixo são ilustrativos e não constituem implementação nesta etapa.

### 6.2 `POST /upload`

Envia um documento.

**Request**

- Método: `POST`
- Content type: `multipart/form-data`
- Campo obrigatório: `file`, contendo exatamente um arquivo.
- Identidade do usuário: obtida do contexto de autenticação quando disponível; enquanto não houver autenticação implementada, usa o mecanismo de owner configurado para o ambiente.

Exemplo conceitual:

```http
POST /upload HTTP/1.1
Content-Type: multipart/form-data; boundary=...

file=<conteudo binario>
```

**Sucesso: `201 Created`**

```json
{
	"id": "doc_01J...",
	"originalName": "relatorio.pdf",
	"size": 24576,
	"uploadedAt": "2026-09-23T12:00:00.000Z",
	"owner": "user-123"
}
```

**Erros previstos**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Nenhum arquivo foi enviado. |
| `400` | `SINGLE_FILE_ONLY` | Mais de um arquivo foi enviado. |
| `413` | `FILE_TOO_LARGE` | O limite configurado foi excedido. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | O tipo MIME não é permitido, quando houver restrição. |
| `500` | `STORAGE_ERROR` | Falha ao gravar ou registrar o arquivo. |

Formato de erro:

```json
{
	"error": {
		"code": "FILE_REQUIRED",
		"message": "Um arquivo deve ser enviado no campo file."
	}
}
```

### 6.3 `GET /documents`

Lista documentos acessíveis ao usuário atual.

**Request**

- Método: `GET`
- Parâmetros de query: nenhum obrigatório nesta versão.
- Filtros, paginação e ordenação avançados ficam fora do escopo.

**Sucesso: `200 OK`**

```json
{
	"documents": [
		{
			"id": "doc_01J...",
			"originalName": "relatorio.pdf",
			"size": 24576,
			"uploadedAt": "2026-09-23T12:00:00.000Z",
			"owner": "user-123"
		}
	]
}
```

A coleção deve ser vazia quando não houver documentos acessíveis. O caminho físico e outros detalhes internos não podem aparecer na resposta.

**Erros previstos**

| Status | Código | Situação |
| --- | --- | --- |
| `500` | `LIST_ERROR` | Falha ao consultar a coleção de metadados. |

### 6.4 `GET /documents/:id/download`

Baixa o conteúdo binário de um documento.

**Request**

- Método: `GET`
- Parâmetro de rota: `id`, identificador opaco retornado pelo upload.
- O controller deve validar o ID e delegar a resolução do arquivo ao service/repository.

**Sucesso: `200 OK`**

- Corpo: bytes do arquivo original.
- `Content-Type`: tipo MIME armazenado ou `application/octet-stream` quando não houver tipo confiável.
- `Content-Length`: tamanho do arquivo, quando disponível.
- `Content-Disposition`: `attachment` com nome seguro derivado de `originalName`.

**Erros previstos**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | O identificador é vazio ou inválido. |
| `404` | `DOCUMENT_NOT_FOUND` | Não existe metadado para o ID informado. |
| `404` | `FILE_NOT_FOUND` | O metadado existe, mas o arquivo físico não está disponível. |
| `403` | `DOCUMENT_FORBIDDEN` | O documento pertence a outro usuário, quando houver contexto de usuário. |
| `500` | `DOWNLOAD_ERROR` | Falha inesperada durante a leitura do arquivo. |

Erros devem seguir o mesmo formato JSON da seção de upload, exceto quando a resposta já tiver iniciado como conteúdo binário.

### 6.5 `GET /health`

Endpoint de verificação operacional já previsto no seed.

**Sucesso: `200 OK`**

```json
{
	"status": "ok"
}
```

## 7. Decisões arquiteturais

### 7.1 Backend

O backend deve seguir o fluxo de dependências:

```text
routes -> controllers -> services -> repositories
```

Responsabilidades:

- `routes/`: registra métodos e caminhos HTTP, configura o middleware de upload e delega ao controller.
- `controllers/`: lê parâmetros, arquivo e contexto da requisição; aplica validação HTTP básica; chama o service; traduz resultados e erros para status e payloads HTTP.
- `services/`: concentra regras de negócio, geração de metadados, autorização por owner quando aplicável e coordenação das operações do repository.
- `repositories/`: grava e lê arquivos locais usando `multer`/filesystem e mantém a coleção de metadados em memória. Não deve conhecer detalhes de HTTP.
- `app.js`: configura Express, middlewares, rotas e endpoint de saúde; não deve concentrar regras de negócio.

O repository é a única camada autorizada a controlar nomes e caminhos físicos. Nenhum provedor externo, bucket, banco de dados ou serviço de upload de terceiros pode ser introduzido nesta versão.

### 7.2 Frontend

O frontend deve manter componentes funcionais com React Hooks e organização por componentes:

- `components/UploadComponent`: seleciona o arquivo, envia `FormData` e exibe resultado ou erro.
- `components/DocumentList`: consulta e renderiza os metadados disponíveis.
- `components/DownloadButton`: inicia o download pelo endpoint do documento.
- `services/`: encapsula chamadas `fetch` para o backend usando URLs com `/api`.
- `App.jsx`: compõe a experiência principal sem duplicar regras de comunicação.

O frontend não deve conhecer `storagePath`, `storageName` ou qualquer detalhe do filesystem.

### 7.3 Tratamento de consistência e segurança

- O upload deve ser considerado bem-sucedido somente após arquivo e metadado serem registrados.
- Falhas parciais devem executar compensação local quando possível.
- Entradas vindas do cliente devem ser validadas antes de chegar ao filesystem.
- O download deve consultar o índice por ID, nunca aceitar um caminho arbitrário.
- Mensagens de erro devem ser úteis para o cliente sem revelar caminhos absolutos, stack traces ou detalhes internos.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Nesta entrega, nenhum arquivo de back-end ou front-end deve ser implementado.

### Etapa 1 - Preparar configuração e storage local

**Arquivos-alvo futuros:** `backend/src/repositories/`, configuração de `backend/src/app.js` e `backend/storage/`.  
**Atividades:** definir diretório configurável, garantir sua existência e configurar `multer` com `diskStorage`; estabelecer limites de tamanho e política de nome físico.  
**Aceite:** um arquivo de teste pode ser recebido pelo middleware e armazenado dentro do diretório local configurado, sem depender de serviço externo.  
**Verificação:** teste de integração do middleware e inspeção de que o caminho final está dentro de `STORAGE_DIR`.

### Etapa 2 - Implementar repository

**Arquivos-alvo futuros:** `backend/src/repositories/documentRepository.js`.  
**Atividades:** criar a coleção em memória, gerar/registrar metadados, localizar por ID, listar por owner e resolver o arquivo físico.  
**Aceite:** o repository mantém a relação entre cada ID e seu arquivo, não expõe detalhes internos na projeção pública e trata arquivo ausente.  
**Verificação:** testes unitários para criação, listagem, consulta, isolamento por owner e inconsistência do filesystem.

### Etapa 3 - Implementar service

**Arquivos-alvo futuros:** `backend/src/services/documentService.js`.  
**Atividades:** coordenar upload, validações de negócio, associação do owner, compensação de falha parcial, listagem e download.  
**Aceite:** regras de negócio funcionam sem depender de `req` ou `res`.  
**Verificação:** testes unitários com repository substituído por doubles simples.

### Etapa 4 - Implementar controllers e rotas

**Arquivos-alvo futuros:** `backend/src/controllers/documentController.js`, `backend/src/routes/documentRoutes.js` e `backend/src/app.js`.  
**Atividades:** conectar middleware Multer, controllers e endpoints; padronizar status e erros JSON; preservar `GET /health`.  
**Aceite:** os três contratos de documentos e o endpoint de saúde respondem conforme a seção 6.  
**Verificação:** testes HTTP com `node:test` cobrindo sucesso, validações, 404, falhas de storage e controle por owner.

### Etapa 5 - Implementar frontend

**Arquivos-alvo futuros:** `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/` e `frontend/src/App.jsx`.  
**Atividades:** criar upload com `FormData`, listagem, tratamento de estados de carregamento/erro e botão de download; usar somente chamadas `fetch` pelo prefixo `/api`.  
**Aceite:** o usuário consegue completar upload, visualizar a lista e baixar um documento pela interface.  
**Verificação:** `npm run build` no frontend e validação manual contra o backend local.

### Etapa 6 - Integração e documentação operacional

**Arquivos-alvo futuros:** testes existentes, `README.md` e documentação de configuração, se necessário.  
**Atividades:** validar proxy Vite, variáveis de ambiente, comportamento após reinício e mensagens de erro; documentar limites conhecidos.  
**Aceite:** backend e frontend iniciam pelos scripts definidos nos respectivos `package.json`, e o fluxo completo funciona localmente.  
**Verificação:** `npm test` no backend, `npm run build` no frontend e roteiro manual de upload, listagem e download.

### 8.1 Critério de conclusão da implementação futura

A implementação será considerada concluída quando todos os requisitos funcionais e não funcionais tiverem testes ou evidência de verificação correspondente, os contratos da seção 6 forem atendidos e nenhum arquivo for gravado fora do storage local configurado. A especificação continuará válida mesmo que detalhes internos de nomes de funções ou organização de arquivos sejam ajustados, desde que as responsabilidades arquiteturais e os contratos públicos sejam preservados.
