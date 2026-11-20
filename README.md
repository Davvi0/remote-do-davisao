# remote do davisao

Controle mobile para **Samsung Tizen e Roku TV**, feito com React, Vite e Node.js. O usuário confirmou controle funcionando na **Samsung UN60DU7700GXZD**. A instalação e os novos ajustes de layout no iPhone ainda precisam de verificação no aparelho.

- [Abrir aplicativo](https://davvi0.github.io/remote-do-davisao/)
- [Código no GitHub](https://github.com/Davvi0/remote-do-davisao)

## Usar no iPhone

1. Abra o aplicativo no **Safari**.
2. Toque em **Compartilhar → Adicionar à Tela de Início**.
3. Ative **Abrir como App da Web**, se essa opção aparecer, e toque em **Adicionar**.
4. Abra pelo ícone **davisao**. O aplicativo usa tela cheia, ícone Apple de 180px e margens para a câmera e o indicador inferior.

O GitHub Pages hospeda a interface e a demonstração por HTTPS. **Para controlar uma TV real, o computador precisa continuar ligado, executando o servidor na mesma rede da TV.** O Pages não executa Node nem tem acesso à sua rede doméstica.

Na página publicada, abra **Servidor local** e configure a origem HTTPS do computador. Não use HTTP dentro do app público HTTPS: navegadores bloqueiam conteúdo misto. O servidor só aceita requisições da origem explicitamente autorizada em `APP_ORIGIN`.

Se você já usa o endereço HTTP do computador, ele continua funcionando no Safari e pode ser adicionado como atalho à Tela de Início; offline/service worker e outros recursos seguros exigem HTTPS confiável. O histórico e o cache são separados entre endereços/origens.

## Executar localmente

Requer Node.js 22.12+; verificado com Node 24.

```sh
npm install
npm run build
npm start
```

Abra `http://localhost:5173` no computador ou o IP exibido no terminal no celular. Ambos devem estar no mesmo Wi-Fi. Para desenvolvimento: `npm run dev`. O computador deve permitir Node no firewall da rede privada.

### HTTPS para o app publicado

No Windows com Git instalado, o projeto inclui um assistente:

```sh
npm run start:https
```

Ele cria uma CA **exclusiva deste aplicativo** e um certificado de servidor em `%LOCALAPPDATA%/remote-do-davisao/certs`, fora do repositório. Não altera a confiança do Windows nem instala nada no iPhone. O servidor HTTPS usa a porta 5443 e autoriza a origem do GitHub Pages. Para escolher o IP: `powershell -File scripts/start-local-https.ps1 -IPAddress 192.168.0.7`.

Instale o certificado público `root-cert.cer` no iPhone e habilite sua confiança em **Ajustes → Geral → Sobre → Ajustes de Confiança de Certificado**. O perfil baixado pode aparecer em Geral → VPN e Gerenciamento de Dispositivo. Para disponibilizar o download pelo servidor HTTP já existente, inicie-o com `LOCAL_CA_CERT` apontando para esse arquivo. O link será `http://IP:5173/setup/local-ca.cer`. A confiança nesse certificado é uma ação manual no iPhone, não pode ser concluída pelo app. Nunca compartilhe os arquivos `*-key.pem`.

Após confiar, abra `https://IP:5443` no Safari e configure esse endereço em **Servidor local** no app publicado. Se o firewall bloquear 5443, permita Node somente na rede privada. O endereço IP do computador precisa permanecer estável; se mudar, execute novamente o assistente e atualize a configuração no app. A CA é reutilizada, enquanto o certificado do servidor é renovado a cada execução do assistente.

Use certificado de uma CA confiável no iPhone. Uma opção local é [mkcert](https://github.com/FiloSottile/mkcert): gere um certificado para o IP/nome do computador e instale **somente o certificado público da CA** no iPhone. No iOS, instale o perfil e habilite a confiança em Ajustes → Geral → Sobre → Ajustes de Confiança de Certificado. Não compartilhe a chave privada da CA. Evite túneis públicos.

Exemplo no PowerShell, substituindo os caminhos e o IP pelos seus:

```powershell
# Depois de instalar mkcert e configurar sua CA local:
mkcert -cert-file C:\certs\remote-cert.pem -key-file C:\certs\remote-key.pem 192.168.0.7 localhost
$env:TLS_CERT='C:\certs\remote-cert.pem'
$env:TLS_KEY='C:\certs\remote-key.pem'
$env:APP_ORIGIN='https://davvi0.github.io'
$env:PORT='5443'
npm start
```

Primeiro abra `https://192.168.0.7:5443` no Safari para conferir a confiança no certificado. Em seguida, configure esse endereço em **Servidor local** no app publicado. Permita o acesso à rede local caso o navegador solicite. Certificados e chaves não entram no repositório. As variáveis são lidas do ambiente; `.env` não é carregado automaticamente. Também é possível usar um proxy HTTPS local com certificado confiável e a mesma configuração de origem.

## Conectar a TV

### Samsung

Mantenha a TV ligada. Clique em Procurar TVs ou informe o IP com a marca Samsung. Aceite **Controle Remoto** na tela em até 45 segundos. Se já negou acesso, confira a lista de dispositivos nas configurações da TV.

O servidor identifica `http://IP:8001/api/v2/` e usa o canal WebSocket Tizen v2. Conexão segura na porta 8002; WS 8001 somente quando a TV anuncia explicitamente que não usa autenticação por token. Não contorna autorização. A implementação foi conferida contra o [projeto samsung-tv-ws-api](https://github.com/xchwarze/samsung-tv-ws-api), pois não há garantia pública da Samsung para esse protocolo local em todo firmware.

Tokens ficam apenas em memória no Node, nunca no navegador, logs ou disco; reiniciar o servidor pode exigir nova permissão. A TV costuma usar certificado autoassinado: a exceção à validação de CA é restrita ao socket da televisão, nunca global. Samsung requer reconexão manual para evitar repetir pedidos de permissão. Play/Pause alterna comandos localmente, sem ler o estado real; usar outro controle pode dessincronizar. Power envia KEY_POWER e pode fechar a conexão. Ligar Samsung via Wake-on-LAN não foi implementado.

### Roku TV

Ative **Controle por aplicativos móveis → Acesso à rede → Ativado** nas configurações avançadas. Use descoberta ou IP. O servidor usa [Roku ECP](https://developer.roku.com/dev/docs/external-control-api) na porta 8060, sem modo desenvolvedor para comandos normais. Volume, canal e energia só são habilitados para Roku TV. Opções envia Info; Ligar TV depende do modelo e standby. Não houve teste físico em Roku.

### Rede e limitações

SSDP usa UDP multicast na rede local e confirma a identificação de cada resposta. Redes de visitantes, firewall e isolamento de clientes podem bloquear a descoberta; use IP manual. Comandos confirmam envio/aceitação de transporte, não garantem efeito em todo aplicativo da TV. LG e Android/Google TV não foram integrados.

## Publicar / atualizar o GitHub Pages

O site publicado usa `main:/docs`. Após alterações:

```sh
npm test
npm run build
npm run build:pages
git add .
git commit -m "Atualiza aplicativo"
git push
```

`docs/` contém a distribuição estática. `dist/`, ignorado pelo Git, contém a versão servida pelo Node local. O build ajusta os caminhos para `/remote-do-davisao/`, insere os assets no precache e cria `.nojekyll`. O worker usa somente o escopo do próprio aplicativo, não armazena a API e remove apenas os caches com seu prefixo. A demonstração funciona offline após instalação completa; controlar a TV continua exigindo a rede e o servidor.

## Estrutura e verificação

- `src/components`, `screens`, `hooks`: interface, instalação e estado.
- `src/services`: API, endereço do servidor e demo isolada.
- `server/adapters`: Samsung e Roku; `server/discovery.js`: SSDP.
- `server/access.js`: origem autorizada/CORS e proteção de host.
- `public`: ícones, manifest e worker; `scripts/prepare-pwa.js`: precache por build.

`npm test` verifica identificação, comandos HTTP/WS, autorização, negação, timeout, token, heartbeat e controle de origem usando servidores locais simulados. Builds e navegador cobrem retrato/paisagem, navegação, PWA e offline. Emulação não substitui teste no iPhone: confirme safe areas, teclado, instalação, retorno de Wi-Fi e controle pelo ícone.

## Segurança

Servidor para rede doméstica confiável; não publique sua porta na internet. Pessoas com acesso ao servidor na rede autorizada podem controlar a TV. Sem contas de usuário. Destinos de TV restritos a IPv4 privado e portas fixas, redirects bloqueados, sessões em memória expiram em uma hora de inatividade. O frontend publicado só aceita configurar origem HTTPS privada ou `.local`. Somente a origem configurada recebe CORS, inclusive preflight de rede privada. Histórico guarda metadados; endereço do servidor fica em localStorage sem tokens.
