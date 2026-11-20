# Direção visual
Interface de operação, discreta e tátil, conforme escopo do usuário. Grafite, texto branco suave, verde pálido para ação e conexão; power em terracota. Tipografia do sistema, ícones Lucide, disco direcional circular, controles secundários distribuídos em três colunas. Sem imagem decorativa. Layout de uma coluna com largura limitada no desktop. Safe areas, foco visível, áreas de toque e movimento reduzido.

Conexão: superfícies grafite com leve tom verde e acabamento em `src/polish.css`.

Controle 2.0, solicitado após rejeição do refinamento anterior: grafite azulado, aro direcional metálico, OK azul-claro, navegação acima do disco, volume/canal horizontais e dock de reprodução. Cabeçalho identifica a versão 2.0. Estilos isolados em `src/remote.css`, sem alterar o protocolo. Verificado no navegador em 390×844, 375×667 e 1440×1000, sem rolagem do controle nesses tamanhos. Demonstração sempre identificada.

Nome aprovado: remote do davisao. PWA e iPhone: `src/mobile.css` aplica safe areas aditivas, composição em duas colunas na paisagem e disco compacto em telas curtas, preservando os alvos de toque. Em 320×568, rolagem vertical deliberada preserva a acessibilidade. Instalação via Safari e configuração HTTPS aparecem em disclosures na conexão. Ícones PNG Apple/maskable usam a mesma identidade azul e grafite.
