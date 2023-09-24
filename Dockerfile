# Use uma imagem base do Apache
FROM httpd:2.4

# Copie os arquivos da sua aplicação para o diretório de documentos do Apache
COPY ./ /usr/local/apache2/htdocs/

# Exponha a porta 80 para que a aplicação possa ser acessada externamente
EXPOSE 80

# Inicie o servidor Apache quando o container for executado
CMD ["httpd-foreground"]