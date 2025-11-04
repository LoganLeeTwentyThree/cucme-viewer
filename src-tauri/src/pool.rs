use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Pool {
    pub id : i8,
    pub mac: String,
    pub dn: i8,
    pub paging_dn : Option<i8>,
}